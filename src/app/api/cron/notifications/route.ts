import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegram } from "@/lib/telegram";
import {
  sendEmail,
  formatDailyBriefEmail,
  formatDangerAlertEmail,
  formatWeeklyReportEmail,
  formatDailyReportEmail,
  formatPreClassEmail,
  formatGenericNoticeEmail
} from "@/lib/email";
import webpush from "web-push";
import { generateQuickMarkToken } from "@/lib/quick-mark-token";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "noreply@attendease.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ===== TIME HELPERS =====

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ===== MERGED CLASS TYPE =====

interface MergedCronClass {
  subjectId: string;
  subjectName: string;
  code: string;
  startTime: string;
  endTime: string;
  room: string | null;
  scheduleId: string;
}

/**
 * Build today's class list with overrides applied.
 * Returns the merged, sorted list of classes for the given user and day.
 */
async function buildMergedClasses(
  userId: string,
  subjects: any[],
  dayOfWeek: number,
  todayKey: string
): Promise<MergedCronClass[]> {
  // Fetch today's overrides
  const overrides = await prisma.scheduleOverride.findMany({
    where: { userId, date: new Date(todayKey + "T00:00:00Z") },
  });

  // Build original time lookup for swap endTime resolution
  const originalBySubject = new Map<string, { startTime: string; endTime: string }>();

  // Start with regular schedules
  let classes: MergedCronClass[] = [];
  for (const sub of subjects) {
    for (const sc of sub.schedules) {
      if (sc.dayOfWeek === dayOfWeek) {
        originalBySubject.set(sub.id, { startTime: sc.startTime, endTime: sc.endTime });
        classes.push({
          subjectId: sub.id,
          subjectName: sub.name,
          code: sub.code,
          startTime: sc.startTime,
          endTime: sc.endTime,
          room: sc.room,
          scheduleId: sc.id,
        });
      }
    }
  }

  // Apply overrides
  for (const ov of overrides) {
    switch (ov.type) {
      case "cancel":
        classes = classes.filter((c) => c.subjectId !== ov.subjectId);
        break;

      case "reschedule": {
        const idx = classes.findIndex((c) => c.subjectId === ov.subjectId);
        if (idx !== -1 && ov.newTime) {
          const orig = classes[idx];
          const duration = timeToMinutes(orig.endTime) - timeToMinutes(orig.startTime);
          const newEnd = duration > 0 ? minutesToTime(timeToMinutes(ov.newTime) + duration) : orig.endTime;
          classes[idx] = { ...orig, startTime: ov.newTime, endTime: newEnd };
        } else if (idx === -1 && ov.newTime) {
          const sub = subjects.find((s: any) => s.id === ov.subjectId);
          if (sub) {
            classes.push({
              subjectId: sub.id, subjectName: sub.name, code: sub.code,
              startTime: ov.newTime, endTime: "", room: null, scheduleId: ov.id,
            });
          }
        }
        break;
      }

      case "extra": {
        const sub = subjects.find((s: any) => s.id === ov.subjectId);
        if (sub) {
          classes.push({
            subjectId: sub.id, subjectName: sub.name, code: sub.code,
            startTime: ov.newTime || "09:00", endTime: "", room: null, scheduleId: ov.id,
          });
        }
        break;
      }

      case "swap": {
        const idx = classes.findIndex((c) => c.subjectId === ov.subjectId);
        if (idx !== -1 && ov.newTime) {
          const swapPartnerOrig = ov.swapSubjectId ? originalBySubject.get(ov.swapSubjectId) : null;
          classes[idx] = {
            ...classes[idx],
            startTime: ov.newTime,
            endTime: swapPartnerOrig?.endTime || classes[idx].endTime,
          };
        }
        break;
      }
    }
  }

  classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return classes;
}

// ===== MAIN HANDLER =====

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const authHeader = req.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isExternalCron = token === process.env.KEEP_ALIVE_TOKEN;

  if (!isVercelCron && !isExternalCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    dailyBriefs: 0,
    preClassReminders: 0,
    dangerAlerts: 0,
    weeklyReports: 0,
    dailyReports: 0,
    completedReminders: 0,
    skippedDuplicates: 0,
    errors: [] as string[],
  };

  try {
    // ==========================================
    // 0. AUTO-COMPLETE REMINDERS
    // ==========================================
    const uncompletedReminders = await prisma.reminder.findMany({
      where: { isCompleted: false },
      select: { id: true, dueDate: true, dueTime: true, user: { select: { timezone: true } } }
    });

    const toCompleteIds: string[] = [];
    for (const r of uncompletedReminders) {
      const tz = r.user.timezone || "Asia/Kolkata";
      const uNow = getTimeInTimezone(now, tz);
      const rDateStr = r.dueDate.toISOString().slice(0, 10);
      const timeStr = `${String(uNow.hours).padStart(2, '0')}:${String(uNow.minutes).padStart(2, '0')}`;

      if (rDateStr < uNow.dateKey) {
        toCompleteIds.push(r.id);
      } else if (rDateStr === uNow.dateKey && r.dueTime && r.dueTime < timeStr) {
        toCompleteIds.push(r.id);
      }
    }

    if (toCompleteIds.length > 0) {
      await prisma.reminder.updateMany({
        where: { id: { in: toCompleteIds } },
        data: { isCompleted: true }
      });
      results.completedReminders = toCompleteIds.length;
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { notificationSetting: { pushEnabled: true } },
          { notificationSetting: { emailEnabled: true } },
          { notificationSetting: { telegramEnabled: true } },
        ],
      },
      include: {
        notificationSetting: true,
        subjects: {
          where: { isArchived: false },
          include: { schedules: true },
        },
        pushSubscriptions: true,
        semesters: {
          where: { isCurrent: true },
          include: { holidays: true, examPeriods: true },
        },
      },
    });

    for (const user of users) {
      try {
        const s = user.notificationSetting;
        if (!s) continue;

        const tz = user.timezone || "Asia/Kolkata";
        const uNow = getTimeInTimezone(now, tz);
        const todayKey = uNow.dateKey;

        // ---- SEMESTER / HOLIDAY / EXAM PERIOD LOGIC ----
        const activeSemester = user.semesters?.[0];
        const todayStart = getTodayStartInTimezone(now, tz);

        if (!activeSemester || new Date(activeSemester.endDate) < todayStart) {
          continue;
        }

        const todayHoliday = activeSemester.holidays.find((h) => {
          const hDate = new Date(h.date);
          return hDate.getTime() === todayStart.getTime();
        });

        const currentExam = activeSemester.examPeriods.find((ep) => {
          return todayStart >= new Date(ep.startDate) && todayStart <= new Date(ep.endDate);
        });

        const isSpecialDay = !!todayHoliday || !!currentExam;

        // ---- BUILD MERGED CLASS LIST (overrides applied) ----
        const mergedClasses = isSpecialDay
          ? []
          : await buildMergedClasses(user.id, user.subjects, uNow.dayOfWeek, todayKey);

        // ==========================================
        // 1. DAILY MORNING BRIEF
        // ==========================================
        const briefHour = s.dailyBriefHour ?? 7;
        const briefMin = s.dailyBriefMinute ?? 0;
        const isBriefTime = uNow.hours === briefHour && uNow.minutes >= briefMin && uNow.minutes < briefMin + 5;

        if (isBriefTime) {
          const bKey = `daily-brief:${todayKey}`;
          if (await wasSent(user.id, bKey)) {
            results.skippedDuplicates++;
          } else {
            // Convert merged classes to brief format
            const todaySch = mergedClasses.map((c) => ({
              subject: c.subjectName, code: c.code,
              startTime: c.startTime, endTime: c.endTime, room: c.room,
            }));

            if (isSpecialDay || todaySch.length === 0) {
              const dayName = new Date(now.toLocaleString("en-US", { timeZone: tz })).toLocaleDateString("en-US", { weekday: "long" });

              let title = "☀️ No Classes Today!";
              let body = `It's ${dayName} — no classes scheduled. Enjoy your day off!`;
              let emoji = "☀️";
              let msg = `Hey ${user.name || "there"}! It's <strong>${dayName}</strong> — you have no classes scheduled today. Enjoy your day off!`;

              if (todayHoliday) {
                title = `🎉 Holiday: ${todayHoliday.name}`;
                body = `It's ${todayHoliday.name} today. No classes scheduled. Enjoy!`;
                emoji = "🎉";
                msg = `Happy <strong>${todayHoliday.name}</strong>! No classes today. Enjoy your holiday!`;
              } else if (currentExam) {
                title = `📝 Exam Period: ${currentExam.name}`;
                body = `Good luck with your exams! Regular classes are cancelled.`;
                emoji = "📝";
                msg = `It's the <strong>${currentExam.name}</strong>. Regular classes are cancelled. Good luck with your exams!`;
              }

              const { subject: eSub, html: eHtml } = formatGenericNoticeEmail(
                user.name,
                `${emoji} ${title.replace(`${emoji} `, "")}`,
                msg,
                "#9b5de5"
              );
              
              const text = `${emoji} *${title.replace(`${emoji} `, "")}*\n\n${msg.replace(/<strong>|<\/strong>/g, "*")}`;

              if (s.telegramEnabled && s.telegramDailyBrief && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, text), `tg-brief-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyBrief && user.email)
                await retry(() => sendEmail(user.email!, eSub, eHtml), `em-brief-${user.id}`, results);
              if (s.pushEnabled && s.pushDailyBrief && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title, body, tag: "daily-brief", data: { url: "/dashboard" },
                });

              await markSent(user.id, bKey, "daily-brief");
              results.dailyBriefs++;
            } else {
              const txt = formatDailyBrief(todaySch, uNow.dateString);
              
              let tA = 0, tC = 0;
              for (const sub of user.subjects) {
                 tA += sub.totalPresent;
                 tC += sub.totalClassesHeld;
              }
              const overallPct = tC > 0 ? Math.round((tA / tC) * 100) : 0;
              
              const mappedClasses = todaySch.map(c => {
                const sub = user.subjects.find((s: any) => s.name === c.subject);
                const pct = sub && sub.totalClassesHeld > 0 ? Math.round((sub.totalPresent / sub.totalClassesHeld) * 100) : 0;
                return { name: c.subject, time: `${c.startTime}-${c.endTime}`, room: c.room, pct, code: c.code };
              });
              
              const { subject: eSub, html: eHtml } = formatDailyBriefEmail(user.name, mappedClasses, overallPct, uNow.dateString);

              if (s.telegramEnabled && s.telegramDailyBrief && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-brief-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyBrief && user.email)
                await retry(() => sendEmail(user.email!, eSub, eHtml), `em-brief-${user.id}`, results);
              if (s.pushEnabled && s.pushDailyBrief && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title: `📚 Today: ${todaySch.length} classes`,
                  body: todaySch.map((c) => `${c.startTime} ${c.subject}`).join(", "),
                  tag: "daily-brief",
                  vibrate: [200, 100, 200, 100, 200],
                  data: { url: "/dashboard" },
                });

              await markSent(user.id, bKey, "daily-brief");
              results.dailyBriefs++;
            }
          }

          // ---- DANGER ZONE ALERTS (sent with daily brief) ----
          const dKey = `danger:${todayKey}`;
          if (!isSpecialDay && !(await wasSent(user.id, dKey))) {
            const danger = user.subjects.filter((sub) => {
              if (sub.totalClassesHeld === 0) return false;
              return ((sub.totalPresent / sub.totalClassesHeld) * 100) < (sub.minAttendancePct || 75);
            });

            if (danger.length > 0) {
              const txt = formatDangerAlert(danger);
              const { subject: eSub, html: eHtml } = formatDangerAlertEmail(user.name, danger);

              if (s.telegramEnabled && s.telegramDangerAlert && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-danger-${user.id}`, results);
              if (s.emailEnabled && s.emailDangerAlert && user.email)
                await retry(() => sendEmail(user.email!, eSub, eHtml), `em-danger-${user.id}`, results);
              if (s.pushEnabled && s.pushDangerAlert && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title: `⚠️ ${danger.length} subjects in danger zone`,
                  body: danger.map((d) => d.name).join(", "),
                  tag: "danger-alert",
                  requireInteraction: true,
                  vibrate: [300, 100, 300, 100, 300],
                  data: { url: "/subjects" },
                });

              await markSent(user.id, dKey, "danger");
              results.dangerAlerts++;
            }
          }

          // ---- WEEKLY REPORT (Sunday at brief time) ----
          if (!isSpecialDay && uNow.dayOfWeek === 0) {
            const wKey = `weekly:${todayKey}`;
            if (!(await wasSent(user.id, wKey))) {
              const txt = formatWeeklyReport(user.subjects);
              let tA = 0, tC = 0;
              user.subjects.forEach((sub) => { tA += sub.totalPresent; tC += sub.totalClassesHeld; });
              const overall = tC > 0 ? Math.round((tA / tC) * 100) : 0;
              const { subject: eSub, html: eHtml } = formatWeeklyReportEmail(user.name, user.subjects);

              if (s.telegramEnabled && s.telegramWeeklyReport && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-weekly-${user.id}`, results);
              if (s.emailEnabled && s.emailWeeklyReport && user.email)
                await retry(() => sendEmail(user.email!, eSub, eHtml), `em-weekly-${user.id}`, results);
              if (s.pushEnabled && s.pushWeeklyReport && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title: `📊 Weekly Report: ${overall}% overall`,
                  body: `${tA}/${tC} classes attended this week`,
                  tag: "weekly-report",
                  data: { url: "/analytics" },
                });

              await markSent(user.id, wKey, "weekly");
              results.weeklyReports++;
            }
          }
        }

        // ==========================================
        // 2. PRE-CLASS REMINDERS (using merged/overridden schedule)
        // ==========================================
        const preMin = s.preClassMinutes ?? 15;

        if (!isSpecialDay) {
          for (const cls of mergedClasses) {
            const [sH, sM] = cls.startTime.split(":").map(Number);
            if (isNaN(sH) || isNaN(sM)) continue;
            const minsUntil = (sH - uNow.hours) * 60 + (sM - uNow.minutes);

            if (minsUntil > 0 && minsUntil <= preMin && minsUntil > preMin - 5) {
              const rKey = `pre-class:${cls.scheduleId}:${todayKey}`;
              if (await wasSent(user.id, rKey)) { results.skippedDuplicates++; continue; }

              const txt = `⏰ *${cls.subjectName}* starts in ${minsUntil} min\n📍 ${cls.room || "No room"} | ${cls.startTime} - ${cls.endTime}`;
              const { subject: eSub, html: eHtml } = formatPreClassEmail(user.name, cls.subjectName, minsUntil, cls);

              if (s.telegramEnabled && s.telegramPreClass && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-pre-${user.id}`, results);
              if (s.emailEnabled && s.emailPreClass && user.email)
                await retry(() => sendEmail(user.email!, eSub, eHtml), `em-pre-${user.id}`, results);
              if (s.pushEnabled && s.pushPreClass && user.pushSubscriptions.length > 0) {
                const qToken = generateQuickMarkToken(user.id, cls.scheduleId, todayKey);
                await pushAll(user.pushSubscriptions, {
                  title: `⏰ ${cls.subjectName} in ${minsUntil} min`,
                  body: `${cls.startTime} - ${cls.endTime}${cls.room ? ` • ${cls.room}` : ""}`,
                  tag: `pre-class-${cls.scheduleId}`,
                  requireInteraction: true,
                  vibrate: [200, 100, 200, 100, 200, 100, 200],
                  data: { scheduleId: cls.scheduleId, subjectId: cls.subjectId, subjectName: cls.subjectName, userId: user.id, quickMarkToken: qToken, url: "/dashboard" },
                });
              }

              await markSent(user.id, rKey, "pre-class");
              results.preClassReminders++;
            }
          }
        }

        // ==========================================
        // 3. DAILY ATTENDANCE REPORT (end of day)
        // ==========================================
        const reportHour = s.dailyReportHour ?? 20;
        const reportMin = s.dailyReportMinute ?? 0;
        const isReportTime = uNow.hours === reportHour && uNow.minutes >= reportMin && uNow.minutes < reportMin + 5;

        if (isReportTime) {
          const rpKey = `daily-report:${todayKey}`;
          if (await wasSent(user.id, rpKey)) {
            results.skippedDuplicates++;
          } else {
            // Fetch today's attendance records
            const todayDateForReport = new Date(todayKey + "T00:00:00Z");
            const todayRecords = await prisma.attendanceRecord.findMany({
              where: {
                subject: { userId: user.id, isArchived: false },
                date: todayDateForReport,
              },
              include: { subject: true },
            });

            // Use merged classes (overrides applied) for the report
            const todayClasses = isSpecialDay ? [] : mergedClasses.map((cls) => ({
              subjectId: cls.subjectId,
              subjectName: cls.subjectName,
              code: cls.code,
              startTime: cls.startTime,
              endTime: cls.endTime,
              room: cls.room,
              status: (todayRecords.find((r) => r.subjectId === cls.subjectId && (r.scheduleId === cls.scheduleId || !r.scheduleId))?.status || "UNMARKED").toUpperCase(),
            }));

            if (isSpecialDay || todayClasses.length === 0) {
              const { subject: eSub, html: eHtml } = formatGenericNoticeEmail(
                user.name,
                "Daily Report — Day Off",
                "You have no classes today. Enjoy your day off!",
                "#4cc9f0"
              );
              
              const dayName = new Date(now.toLocaleString("en-US", { timeZone: tz })).toLocaleDateString("en-US", { weekday: "long" });
              let title = "Daily Report — Day Off";
              let body = `No classes were scheduled today (${dayName}). No attendance to report!`;
              let msg = `No classes were scheduled today (<strong>${dayName}</strong>).`;

              if (todayHoliday) {
                title = `Daily Report — ${todayHoliday.name}`;
                body = `It was ${todayHoliday.name} today. No attendance to report!`;
                msg = `It was <strong>${todayHoliday.name}</strong> today.`;
              } else if (currentExam) {
                title = `Daily Report — Exam Period`;
                body = `Exam period ongoing. No regular attendance to report!`;
                msg = `It is currently the <strong>${currentExam.name}</strong>.`;
              }

              const text = `[ ${title} ]\n\n${getGreeting(uNow.hours)}, ${user.name || "Student"}\n\n${msg.replace(/<strong>|<\/strong>/g, "*")}\nNo attendance to report — see you on the next class day!\n\nRegards,\nTeam AttendEase\nhttps://attendease-c7wl.vercel.app/`;

              if (s.telegramEnabled && s.telegramDailyReport && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, text), `tg-report-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyReport && user.email)
                await retry(() => sendEmail(user.email!, eSub, eHtml), `em-report-${user.id}`, results);
              if (s.pushEnabled && s.pushDailyReport && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title, body, tag: "daily-report", data: { url: "/dashboard" },
                });

              await markSent(user.id, rpKey, "daily-report");
              results.dailyReports++;
            } else {
              const present = todayClasses.filter((c) => c.status === "PRESENT" || c.status === "LATE").length;
              const absent = todayClasses.filter((c) => c.status === "ABSENT").length;
              const unmarked = todayClasses.filter((c) => c.status === "UNMARKED").length;

              const txt = formatDailyReport(todayClasses, present, absent, unmarked, uNow.dateString, user.name, uNow.hours);
              const { subject: eSub, html: eHtml } = formatDailyReportEmail(
                user.name,
                todayClasses,
                present,
                absent,
                unmarked,
                uNow.dateString
              );

              if (s.telegramEnabled && s.telegramDailyReport && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-report-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyReport && user.email)
                await retry(() => sendEmail(user.email!, eSub, eHtml), `em-report-${user.id}`, results);
              if (s.pushEnabled && s.pushDailyReport && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title: `📋 Today: ${present}/${todayClasses.length} attended`,
                  body: `${absent > 0 ? `${absent} missed` : "All attended!"}${unmarked > 0 ? ` • ${unmarked} unmarked` : ""}`,
                  tag: "daily-report",
                  data: { url: "/dashboard" },
                });

              await markSent(user.id, rpKey, "daily-report");
              results.dailyReports++;
            }
          }
        }

      } catch (userErr: any) {
        results.errors.push(`User ${user.id}: ${userErr.message}`);
      }
    }

    // Cleanup old records (7 days)
    await prisma.sentNotification.deleteMany({
      where: { sentAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });

  } catch (err: any) {
    console.error("[Cron] Fatal:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  console.log("[Cron] Results:", results);
  return NextResponse.json({ ok: true, ...results });
}

// ===== HELPERS =====

async function wasSent(userId: string, key: string): Promise<boolean> {
  const r = await prisma.sentNotification.findUnique({ where: { userId_key: { userId, key } } });
  return !!r;
}

async function markSent(userId: string, key: string, type: string) {
  await prisma.sentNotification.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, type },
    update: { sentAt: new Date() },
  });
}

async function retry(fn: () => Promise<any>, label: string, results: { errors: string[] }, max = 2): Promise<boolean> {
  for (let i = 1; i <= max; i++) {
    try { await fn(); return true; }
    catch (e: any) {
      if (i === max) { results.errors.push(`${label}: ${e.message}`); return false; }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

async function pushAll(subs: any[], payload: Record<string, any>) {
  const json = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        json
      ).catch((err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      })
    )
  );
}

function getTimeInTimezone(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "numeric", weekday: "short",
    year: "numeric", month: "2-digit", day: "2-digit", hour12: false,
  });
  const p = f.formatToParts(date);
  const g = (t: string) => p.find((x) => x.type === t)?.value || "";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dateKey = `${g("year")}-${g("month")}-${g("day")}`;
  const rf = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric" });
  const rawHour = g("hour");
  return {
    hours: rawHour === "24" ? 0 : parseInt(rawHour),
    minutes: parseInt(g("minute")),
    dayOfWeek: dayMap[g("weekday")] ?? date.getDay(),
    dateKey,
    dateString: rf.format(date),
  };
}

function getTodayStartInTimezone(date: Date, tz: string): Date {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  const dateStr = f.format(date);
  return new Date(dateStr + "T00:00:00Z");
}

// ===== FORMATTERS =====

function formatDailyBrief(schedules: any[], dateString: string): string {
  let t = `📚 *Today's Classes — ${dateString}*\n\n`;
  for (const s of schedules) {
    t += `🕐 *${s.startTime} - ${s.endTime}*\n   ${s.subject}${s.code ? ` (${s.code})` : ""}`;
    if (s.room) t += `\n   📍 ${s.room}`;
    t += "\n\n";
  }
  t += `Total: ${schedules.length} class${schedules.length !== 1 ? "es" : ""} today`;
  return t;
}





function formatDangerAlert(subjects: any[]): string {
  let t = `⚠️ *Attendance Alert*\n\n`;
  for (const s of subjects) {
    const pct = s.totalClassesHeld > 0 ? Math.round((s.totalPresent / s.totalClassesHeld) * 100) : 0;
    t += `🔴 *${s.name}*: ${pct}% (need ${s.minAttendancePct || 75}%)\n   ${s.totalPresent}/${s.totalClassesHeld} attended\n\n`;
  }
  return t;
}



function formatWeeklyReport(subjects: any[]): string {
  let t = `📊 *Weekly Attendance Report*\n\n`;
  let tA = 0, tC = 0;
  for (const s of subjects) {
    const pct = s.totalClassesHeld > 0 ? Math.round((s.totalPresent / s.totalClassesHeld) * 100) : 0;
    const e = pct >= 75 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
    t += `${e} *${s.name}*: ${pct}% (${s.totalPresent}/${s.totalClassesHeld})\n`;
    tA += s.totalPresent; tC += s.totalClassesHeld;
  }
  t += `\n📈 *Overall: ${tC > 0 ? Math.round((tA / tC) * 100) : 0}%* (${tA}/${tC})`;
  return t;
}



function getGreeting(hours: number): string {
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}

function formatDailyReport(classes: any[], present: number, absent: number, unmarked: number, dateString: string, userName: string | null, hours: number): string {
  const greeting = getGreeting(hours);
  const name = userName || "Student";
  let t = `[ Daily Attendance Report — ${dateString} ]\n\n${greeting}, ${name}\n\n`;
  for (const c of classes) {
    const icon = c.status === "PRESENT" ? "[✓]" : c.status === "LATE" ? "[⏱]" : c.status === "ABSENT" ? "[✕]" : "[−]";
    t += `${icon} *${c.subjectName}* (${c.startTime})\n   Status: ${c.status}\n\n`;
  }
  t += `\n[ Summary ]\n${present} present, ${absent} absent, ${unmarked} unmarked out of ${classes.length}\n\nRegards,\nTeam AttendEase\nhttps://attendease-c7wl.vercel.app/`;
  return t;
}


