import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegram } from "@/lib/telegram";
import { sendEmail } from "@/lib/email";
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
    skippedDuplicates: 0,
    errors: [] as string[],
  };

  try {
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
        
        // If no active semester or semester ended, skip ALL notifications
        if (!activeSemester || new Date(activeSemester.endDate) < todayStart) {
          continue;
        }

        const todayHoliday = activeSemester.holidays.find(h => {
          const hDate = new Date(h.date);
          return hDate.getTime() === todayStart.getTime();
        });

        const currentExam = activeSemester.examPeriods.find(ep => {
          return todayStart >= new Date(ep.startDate) && todayStart <= new Date(ep.endDate);
        });

        const isSpecialDay = !!todayHoliday || !!currentExam;

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
            const todaySch = isSpecialDay ? [] : user.subjects.flatMap((sub) =>
              sub.schedules
                .filter((sc) => sc.dayOfWeek === uNow.dayOfWeek)
                .map((sc) => ({ subject: sub.name, code: sub.code, startTime: sc.startTime, endTime: sc.endTime, room: sc.room }))
            ).sort((a, b) => a.startTime.localeCompare(b.startTime));

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

              const html = `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0B0F1A; padding: 24px; border-radius: 16px; color: #fff;">
                  <h2 style="color: #7C3AED; margin: 0 0 16px;">${emoji} ${title.replace(`${emoji} `, "")}</h2>
                  <p>${msg}</p>
                </div>
              `;
              const text = `${emoji} *${title.replace(`${emoji} `, "")}*\n\n${msg.replace(/<strong>|<\/strong>/g, "*")}`;

              if (s.telegramEnabled && s.telegramDailyBrief && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, text), `tg-brief-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyBrief && user.email)
                await retry(() => sendEmail(user.email!, `${title} — AttendEase`, html), `em-brief-${user.id}`, results);
              if (s.pushEnabled && s.pushDailyBrief && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title,
                  body,
                  tag: "daily-brief",
                  data: { url: "/dashboard" },
                });

              await markSent(user.id, bKey, "daily-brief");
              results.dailyBriefs++;
            } else {
              const txt = formatDailyBrief(todaySch, uNow.dateString);
              const html = formatDailyBriefHTML(todaySch, uNow.dateString);

              if (s.telegramEnabled && s.telegramDailyBrief && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-brief-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyBrief && user.email)
                await retry(() => sendEmail(user.email!, `📚 Today's Classes — ${uNow.dateString}`, html), `em-brief-${user.id}`, results);
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
              const html = formatDangerAlertHTML(danger);

              if (s.telegramEnabled && s.telegramDangerAlert && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-danger-${user.id}`, results);
              if (s.emailEnabled && s.emailDangerAlert && user.email)
                await retry(() => sendEmail(user.email!, `⚠️ ${danger.length} subjects below minimum`, html), `em-danger-${user.id}`, results);
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
              const html = formatWeeklyReportHTML(user.subjects);
              let tA = 0, tC = 0;
              user.subjects.forEach((sub) => { tA += sub.totalPresent; tC += sub.totalClassesHeld; });
              const overall = tC > 0 ? Math.round((tA / tC) * 100) : 0;

              if (s.telegramEnabled && s.telegramWeeklyReport && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-weekly-${user.id}`, results);
              if (s.emailEnabled && s.emailWeeklyReport && user.email)
                await retry(() => sendEmail(user.email!, `📊 Weekly Attendance Report`, html), `em-weekly-${user.id}`, results);
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
        // 2. PRE-CLASS REMINDERS
        // ==========================================
        const preMin = s.preClassMinutes ?? 15;

        if (!isSpecialDay) {
          for (const subject of user.subjects) {
          for (const schedule of subject.schedules) {
            if (schedule.dayOfWeek !== uNow.dayOfWeek) continue;

            const [sH, sM] = schedule.startTime.split(":").map(Number);
            if (isNaN(sH) || isNaN(sM)) continue;
            const minsUntil = (sH - uNow.hours) * 60 + (sM - uNow.minutes);

            if (minsUntil > 0 && minsUntil <= preMin && minsUntil > preMin - 5) {
              const rKey = `pre-class:${schedule.id}:${todayKey}`;
              if (await wasSent(user.id, rKey)) { results.skippedDuplicates++; continue; }

              const txt = `⏰ *${subject.name}* starts in ${minsUntil} min\n📍 ${schedule.room || "No room"} | ${schedule.startTime} - ${schedule.endTime}`;
              const html = formatPreClassHTML(subject.name, minsUntil, schedule);

              if (s.telegramEnabled && s.telegramPreClass && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-pre-${user.id}`, results);
              if (s.emailEnabled && s.emailPreClass && user.email)
                await retry(() => sendEmail(user.email!, `⏰ ${subject.name} in ${minsUntil} min`, html), `em-pre-${user.id}`, results);
              if (s.pushEnabled && s.pushPreClass && user.pushSubscriptions.length > 0) {
                const qToken = generateQuickMarkToken(user.id, schedule.id, todayKey);
                await pushAll(user.pushSubscriptions, {
                  title: `⏰ ${subject.name} in ${minsUntil} min`,
                  body: `${schedule.startTime} - ${schedule.endTime}${schedule.room ? ` • ${schedule.room}` : ""}`,
                  tag: `pre-class-${schedule.id}`,
                  requireInteraction: true,
                  vibrate: [200, 100, 200, 100, 200, 100, 200],
                  data: { scheduleId: schedule.id, subjectId: subject.id, subjectName: subject.name, userId: user.id, quickMarkToken: qToken, url: "/dashboard" },
                });
              }

              await markSent(user.id, rKey, "pre-class");
              results.preClassReminders++;
            }
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
            // Fetch today's attendance records for this user
            // AttendanceRecord.date is @db.Date — use exact date match
            const todayDateForReport = new Date(todayKey + "T00:00:00Z");

            const todayRecords = await prisma.attendanceRecord.findMany({
              where: {
                subject: { userId: user.id, isArchived: false },
                date: todayDateForReport,
              },
              include: { subject: true },
            });

            // Get today's scheduled classes
            const todayClasses = isSpecialDay ? [] : user.subjects.flatMap((sub) =>
              sub.schedules
                .filter((sc) => sc.dayOfWeek === uNow.dayOfWeek)
                .map((sc) => ({
                  subjectId: sub.id,
                  subjectName: sub.name,
                  code: sub.code,
                  startTime: sc.startTime,
                  endTime: sc.endTime,
                  room: sc.room,
                  status: todayRecords.find((r) => r.subjectId === sub.id && r.scheduleId === sc.id)?.status || "UNMARKED",
                }))
            ).sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (isSpecialDay || todayClasses.length === 0) {
              const dayName = new Date(now.toLocaleString("en-US", { timeZone: tz })).toLocaleDateString("en-US", { weekday: "long" });
              let title = "📊 Daily Report — Day Off";
              let body = `No classes were scheduled today (${dayName}). No attendance to report!`;
              let msg = `No classes were scheduled today (<strong>${dayName}</strong>).`;
              
              if (todayHoliday) {
                title = `🎉 Daily Report — ${todayHoliday.name}`;
                body = `It was ${todayHoliday.name} today. No attendance to report!`;
                msg = `It was <strong>${todayHoliday.name}</strong> today.`;
              } else if (currentExam) {
                title = `📝 Daily Report — Exam Period`;
                body = `Exam period ongoing. No regular attendance to report!`;
                msg = `It is currently the <strong>${currentExam.name}</strong>.`;
              }

              const html = `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0B0F1A; padding: 24px; border-radius: 16px; color: #fff;">
                  <h2 style="color: #7C3AED; margin: 0 0 16px;">${title}</h2>
                  <p>${msg}</p>
                  <p style="color: #9CA3AF;">No attendance to report — see you on the next class day! 📚</p>
                </div>
              `;
              const text = `*${title}*\n\n${msg.replace(/<strong>|<\/strong>/g, "*")}\nNo attendance to report — see you on the next class day! 📚`;

              if (s.telegramEnabled && s.telegramDailyReport && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, text), `tg-report-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyReport && user.email)
                await retry(() => sendEmail(user.email!, "📊 Daily Report — Day Off — AttendEase", html), `em-report-${user.id}`, results);
              if (s.pushEnabled && s.pushDailyReport && user.pushSubscriptions.length > 0)
                await pushAll(user.pushSubscriptions, {
                  title,
                  body,
                  tag: "daily-report",
                  data: { url: "/dashboard" },
                });

              await markSent(user.id, rpKey, "daily-report");
              results.dailyReports++;
            } else {
              const present = todayClasses.filter((c) => c.status === "PRESENT" || c.status === "LATE").length;
              const absent = todayClasses.filter((c) => c.status === "ABSENT").length;
              const unmarked = todayClasses.filter((c) => c.status === "UNMARKED").length;

              const txt = formatDailyReport(todayClasses, present, absent, unmarked, uNow.dateString);
              const html = formatDailyReportHTML(todayClasses, present, absent, unmarked, uNow.dateString);

              if (s.telegramEnabled && s.telegramDailyReport && user.telegramChatId)
                await retry(() => sendTelegram(user.telegramChatId!, txt), `tg-report-${user.id}`, results);
              if (s.emailEnabled && s.emailDailyReport && user.email)
                await retry(() => sendEmail(user.email!, `📋 Daily Report — ${uNow.dateString}`, html), `em-report-${user.id}`, results);
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
  const dateStr = f.format(date); // YYYY-MM-DD
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

function formatDailyBriefHTML(schedules: any[], dateString: string): string {
  const rows = schedules.map((s) => `
    <tr>
      <td style="padding:8px 12px;color:#06B6D4;font-weight:600;">${s.startTime}-${s.endTime}</td>
      <td style="padding:8px 12px;color:#fff;">${s.subject}${s.code ? ` (${s.code})` : ""}</td>
      <td style="padding:8px 12px;color:#9CA3AF;">${s.room || "-"}</td>
    </tr>`).join("");

  return `<div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
    <h2 style="color:#7C3AED;margin:0 0 16px;">📚 Today's Classes</h2>
    <p style="color:#9CA3AF;margin:0 0 16px;">${dateString}</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">TIME</th>
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">SUBJECT</th>
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">ROOM</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#9CA3AF;margin:16px 0 0;font-size:13px;">${schedules.length} class${schedules.length !== 1 ? "es" : ""} today — AttendEase</p>
  </div>`;
}

function formatPreClassHTML(name: string, mins: number, sch: any): string {
  return `<div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
    <h2 style="color:#7C3AED;margin:0 0 8px;">⏰ ${name}</h2>
    <p style="font-size:20px;margin:0 0 16px;color:#06B6D4;">Starts in <strong>${mins} minutes</strong></p>
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:12px;">
      <p style="margin:0;color:#fff;">🕐 ${sch.startTime} - ${sch.endTime}</p>
      <p style="margin:4px 0 0;color:#9CA3AF;">📍 ${sch.room || "No room"}</p>
    </div>
    <p style="color:#9CA3AF;margin:16px 0 0;font-size:13px;">Open AttendEase to mark attendance.</p>
  </div>`;
}

function formatDangerAlert(subjects: any[]): string {
  let t = `⚠️ *Attendance Alert*\n\n`;
  for (const s of subjects) {
    const pct = s.totalClassesHeld > 0 ? Math.round((s.totalPresent / s.totalClassesHeld) * 100) : 0;
    t += `🔴 *${s.name}*: ${pct}% (need ${s.minAttendancePct || 75}%)\n   ${s.totalPresent}/${s.totalClassesHeld} attended\n\n`;
  }
  return t;
}

function formatDangerAlertHTML(subjects: any[]): string {
  const rows = subjects.map((s) => {
    const pct = s.totalClassesHeld > 0 ? Math.round((s.totalPresent / s.totalClassesHeld) * 100) : 0;
    return `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:12px;margin-bottom:8px;">
      <strong style="color:#EF4444;">${s.name}</strong>
      <span style="color:#9CA3AF;margin-left:8px;">${pct}% (need ${s.minAttendancePct || 75}%)</span>
      <div style="color:#9CA3AF;font-size:13px;">${s.totalPresent}/${s.totalClassesHeld} attended</div>
    </div>`;
  }).join("");

  return `<div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
    <h2 style="color:#EF4444;margin:0 0 16px;">⚠️ Attendance Alert</h2>
    ${rows}
    <p style="color:#9CA3AF;margin:16px 0 0;font-size:13px;">Open AttendEase to see recovery plan.</p>
  </div>`;
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

function formatWeeklyReportHTML(subjects: any[]): string {
  let tA = 0, tC = 0;
  const rows = subjects.map((s) => {
    const pct = s.totalClassesHeld > 0 ? Math.round((s.totalPresent / s.totalClassesHeld) * 100) : 0;
    tA += s.totalPresent; tC += s.totalClassesHeld;
    const color = pct >= 75 ? "#22C55E" : pct >= 50 ? "#EAB308" : "#EF4444";
    return `<tr>
      <td style="padding:8px 12px;color:#fff;">${s.name}</td>
      <td style="padding:8px 12px;color:${color};font-weight:600;">${pct}%</td>
      <td style="padding:8px 12px;color:#9CA3AF;">${s.totalPresent}/${s.totalClassesHeld}</td>
    </tr>`;
  }).join("");
  const overall = tC > 0 ? Math.round((tA / tC) * 100) : 0;

  return `<div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
    <h2 style="color:#7C3AED;margin:0 0 16px;">📊 Weekly Report</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">SUBJECT</th>
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">%</th>
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">ATTENDED</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:16px;padding:12px;background:rgba(124,58,237,0.15);border-radius:12px;text-align:center;">
      <span style="color:#7C3AED;font-size:24px;font-weight:700;">${overall}%</span>
      <div style="color:#9CA3AF;font-size:13px;">Overall Attendance</div>
    </div>
  </div>`;
}

function formatDailyReport(classes: any[], present: number, absent: number, unmarked: number, dateString: string): string {
  let t = `📋 *Daily Attendance Report — ${dateString}*\n\n`;
  for (const c of classes) {
    const icon = c.status === "PRESENT" ? "✅" : c.status === "LATE" ? "⏰" : c.status === "ABSENT" ? "❌" : "⬜";
    t += `${icon} *${c.subjectName}* (${c.startTime})\n   Status: ${c.status}\n\n`;
  }
  t += `\n📊 *Summary:* ${present} present, ${absent} absent, ${unmarked} unmarked out of ${classes.length}`;
  return t;
}

function formatDailyReportHTML(classes: any[], present: number, absent: number, unmarked: number, dateString: string): string {
  const rows = classes.map((c) => {
    const statusColor = c.status === "PRESENT" ? "#22C55E" : c.status === "LATE" ? "#EAB308" : c.status === "ABSENT" ? "#EF4444" : "#6B7280";
    const statusIcon = c.status === "PRESENT" ? "✅" : c.status === "LATE" ? "⏰" : c.status === "ABSENT" ? "❌" : "⬜";
    return `<tr>
      <td style="padding:8px 12px;color:#06B6D4;font-weight:600;">${c.startTime}</td>
      <td style="padding:8px 12px;color:#fff;">${c.subjectName}${c.code ? ` (${c.code})` : ""}</td>
      <td style="padding:8px 12px;color:${statusColor};font-weight:600;">${statusIcon} ${c.status}</td>
    </tr>`;
  }).join("");

  const total = classes.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const pctColor = pct >= 75 ? "#22C55E" : pct >= 50 ? "#EAB308" : "#EF4444";

  return `<div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
    <h2 style="color:#7C3AED;margin:0 0 16px;">📋 Daily Report</h2>
    <p style="color:#9CA3AF;margin:0 0 16px;">${dateString}</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">TIME</th>
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">SUBJECT</th>
        <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">STATUS</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:16px;display:flex;gap:8px;">
      <div style="flex:1;padding:12px;background:rgba(34,197,94,0.1);border-radius:12px;text-align:center;">
        <div style="color:#22C55E;font-size:20px;font-weight:700;">${present}</div>
        <div style="color:#9CA3AF;font-size:11px;">Present</div>
      </div>
      <div style="flex:1;padding:12px;background:rgba(239,68,68,0.1);border-radius:12px;text-align:center;">
        <div style="color:#EF4444;font-size:20px;font-weight:700;">${absent}</div>
        <div style="color:#9CA3AF;font-size:11px;">Absent</div>
      </div>
      <div style="flex:1;padding:12px;background:rgba(107,114,128,0.1);border-radius:12px;text-align:center;">
        <div style="color:#6B7280;font-size:20px;font-weight:700;">${unmarked}</div>
        <div style="color:#9CA3AF;font-size:11px;">Unmarked</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:12px;background:rgba(124,58,237,0.15);border-radius:12px;text-align:center;">
      <span style="color:${pctColor};font-size:24px;font-weight:700;">${pct}%</span>
      <div style="color:#9CA3AF;font-size:13px;">Today's Attendance</div>
    </div>
  </div>`;
}