import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegram } from "@/lib/telegram";
import { sendEmail } from "@/lib/email";
import webpush from "web-push";
import { generateQuickMarkToken } from "@/lib/quick-mark-token";

// Set VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "noreply@attendease.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel Hobby limit

export async function GET(req: NextRequest) {
  // Auth: verify cron secret OR keep-alive token
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
    dangerAlerts: 0,
    preClassReminders: 0,
    weeklyReports: 0,
    skippedDuplicates: 0,
    errors: [] as string[],
  };

  try {
    // Get all users with any notification enabled
    const usersWithSettings = await prisma.user.findMany({
      where: {
        OR: [
          { notificationSetting: { telegramEnabled: true } },
          { notificationSetting: { emailEnabled: true } },
          { notificationSetting: { pushEnabled: true } },
        ],
      },
      include: {
        notificationSetting: true,
        subjects: {
          where: { isArchived: false },
          include: { schedules: true, attendanceRecords: true },
        },
        pushSubscriptions: true,
      },
    });

    for (const user of usersWithSettings) {
      try {
        const settings = user.notificationSetting;
        if (!settings) continue;

        const userTz = user.timezone || "Asia/Kolkata";
        const userNow = getTimeInTimezone(now, userTz);
        const userHour = userNow.hours;
        const userMinute = userNow.minutes;
        const userDayOfWeek = userNow.dayOfWeek;
        const todayKey = userNow.dateKey; // YYYY-MM-DD in user's timezone

        const briefHour = settings.dailyBriefHour ?? 7;
        const briefMinute = settings.dailyBriefMinute ?? 0;

        // Check if it's time for this user's daily brief (within 5-min window)
        const isBriefTime =
          userHour === briefHour &&
          userMinute >= briefMinute &&
          userMinute < briefMinute + 5;

        // ==========================================
        // 1. DAILY BRIEF
        // ==========================================
        if (isBriefTime) {
          const briefKey = `daily-brief:${todayKey}`;

          if (await wasAlreadySent(user.id, briefKey)) {
            results.skippedDuplicates++;
          } else {
            const todaySchedules = user.subjects.flatMap((sub) =>
              sub.schedules
                .filter((sch) => sch.dayOfWeek === userDayOfWeek)
                .map((sch) => ({
                  subject: sub.name,
                  code: sub.code,
                  startTime: sch.startTime,
                  endTime: sch.endTime,
                  room: sch.room,
                }))
            );

            todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (todaySchedules.length > 0) {
              const briefText = formatDailyBrief(todaySchedules, userNow.dateString);

              // --- Telegram ---
              if (settings.telegramEnabled && settings.telegramDailyBrief && user.telegramChatId) {
                await sendWithRetry(
                  () => sendTelegram(user.telegramChatId!, briefText),
                  `Telegram brief ${user.id}`,
                  results
                );
              }

              // --- Email ---
              if (settings.emailEnabled && settings.emailDailyBrief && user.email) {
                await sendWithRetry(
                  () => sendEmail(
                    user.email!,
                    `📚 Today's Classes — ${userNow.dateString}`,
                    formatDailyBriefHTML(todaySchedules, userNow.dateString)
                  ),
                  `Email brief ${user.id}`,
                  results
                );
              }

              // --- Push ---
              if (settings.pushEnabled && user.pushSubscriptions?.length > 0) {
                const pushPayload = JSON.stringify({
                  title: `📚 Today: ${todaySchedules.length} classes`,
                  body: todaySchedules.map((s) => `${s.startTime} ${s.subject}`).join(", "),
                  tag: "daily-brief",
                  vibrate: [200, 100, 200, 100, 200],
                  data: { url: "/dashboard" },
                });

                await sendPushToAll(user.pushSubscriptions, pushPayload);
              }

              await markAsSent(user.id, briefKey);
              results.dailyBriefs++;
            }
          }
        }

        // ==========================================
        // 2. PRE-CLASS REMINDERS (server-side)
        // ==========================================
        const preClassMinutes = settings.preClassMinutes ?? 15;

        for (const subject of user.subjects) {
          for (const schedule of subject.schedules) {
            if (schedule.dayOfWeek !== userDayOfWeek) continue;

            const [schedHour, schedMin] = schedule.startTime.split(":").map(Number);
            if (isNaN(schedHour) || isNaN(schedMin)) continue;

            const minutesUntilClass = (schedHour - userHour) * 60 + (schedMin - userMinute);

            // Send if class is within the reminder window
            // Window: 0 < minutesUntilClass <= preClassMinutes
            // Only trigger if within 5 min of the ideal reminder time to avoid dupes
            if (
              minutesUntilClass > 0 &&
              minutesUntilClass <= preClassMinutes &&
              minutesUntilClass > preClassMinutes - 5
            ) {
              const reminderKey = `pre-class:${schedule.id}:${todayKey}`;

              if (await wasAlreadySent(user.id, reminderKey)) {
                results.skippedDuplicates++;
                continue;
              }

              const reminderText = `⏰ *${subject.name}* starts in ${minutesUntilClass} min\n📍 ${schedule.room || "No room"} | ${schedule.startTime} - ${schedule.endTime}`;

              // --- Telegram ---
              if (settings.telegramEnabled && settings.telegramPreClass && user.telegramChatId) {
                await sendWithRetry(
                  () => sendTelegram(user.telegramChatId!, reminderText),
                  `Telegram reminder ${user.id}`,
                  results
                );
              }

              // --- Email ---
              if (settings.emailEnabled && settings.emailPreClass && user.email) {
                await sendWithRetry(
                  () => sendEmail(
                    user.email!,
                    `⏰ ${subject.name} in ${minutesUntilClass} min`,
                    formatPreClassHTML(subject.name, minutesUntilClass, schedule)
                  ),
                  `Email reminder ${user.id}`,
                  results
                );
              }

              // --- Push with action buttons ---
              if (settings.pushEnabled && user.pushSubscriptions?.length > 0) {
                const quickMarkToken = generateQuickMarkToken(user.id, schedule.id);
                const pushPayload = JSON.stringify({
                  title: `⏰ ${subject.name} in ${minutesUntilClass} min`,
                  body: `${schedule.startTime} - ${schedule.endTime}${schedule.room ? ` • ${schedule.room}` : ""}`,
                  tag: `pre-class-${schedule.id}`,
                  requireInteraction: true, // Keep notification visible until user acts
                  vibrate: [200, 100, 200, 100, 200, 100, 200], // Strong vibration
                  data: {
                    scheduleId: schedule.id,
                    subjectId: subject.id,
                    subjectName: subject.name,
                    userId: user.id,
                    quickMarkToken,
                    url: "/dashboard",
                  },
                });

                await sendPushToAll(user.pushSubscriptions, pushPayload);
              }

              await markAsSent(user.id, reminderKey);
              results.preClassReminders++;
            }
          }
        }

        // ==========================================
        // 3. DANGER ALERTS (once daily at brief time)
        // ==========================================
        if (isBriefTime) {
          const dangerKey = `danger-alert:${todayKey}`;

          if (!(await wasAlreadySent(user.id, dangerKey))) {
            const dangerSubjects = user.subjects.filter((sub) => {
              if (sub.totalClassesHeld === 0) return false;
              const pct = ((sub.totalPresent + sub.totalLate) / sub.totalClassesHeld) * 100;
              return pct < (sub.minAttendancePct || 75);
            });

            if (dangerSubjects.length > 0) {
              const dangerText = formatDangerAlert(dangerSubjects);

              if (settings.telegramEnabled && settings.telegramDangerAlert && user.telegramChatId) {
                await sendWithRetry(
                  () => sendTelegram(user.telegramChatId!, dangerText),
                  `Telegram danger ${user.id}`,
                  results
                );
              }

              if (settings.emailEnabled && settings.emailDangerAlert && user.email) {
                await sendWithRetry(
                  () => sendEmail(
                    user.email!,
                    `⚠️ Attendance Alert — ${dangerSubjects.length} subjects in danger`,
                    formatDangerAlertHTML(dangerSubjects)
                  ),
                  `Email danger ${user.id}`,
                  results
                );
              }

              if (settings.pushEnabled && user.pushSubscriptions?.length > 0) {
                const pushPayload = JSON.stringify({
                  title: `⚠️ ${dangerSubjects.length} subjects below ${dangerSubjects[0].minAttendancePct || 75}%`,
                  body: dangerSubjects.map((s) => s.name).join(", "),
                  tag: "danger-alert",
                  requireInteraction: true,
                  vibrate: [300, 100, 300, 100, 300],
                  data: { url: "/subjects" },
                });
                await sendPushToAll(user.pushSubscriptions, pushPayload);
              }

              await markAsSent(user.id, dangerKey);
              results.dangerAlerts++;
            }
          }
        }

        // ==========================================
        // 4. WEEKLY REPORT (Sunday at brief time)
        // ==========================================
        if (isBriefTime && userDayOfWeek === 0) {
          const weeklyKey = `weekly-report:${todayKey}`;

          if (!(await wasAlreadySent(user.id, weeklyKey))) {
            if (settings.telegramEnabled && settings.telegramWeeklyReport && user.telegramChatId) {
              const reportText = formatWeeklyReport(user.subjects);
              await sendWithRetry(
                () => sendTelegram(user.telegramChatId!, reportText),
                `Telegram weekly ${user.id}`,
                results
              );
            }

            if (settings.emailEnabled && settings.emailWeeklyReport && user.email) {
              const reportHTML = formatWeeklyReportHTML(user.subjects);
              await sendWithRetry(
                () => sendEmail(user.email!, "📊 Weekly Attendance Report", reportHTML),
                `Email weekly ${user.id}`,
                results
              );
            }

            if (settings.pushEnabled && user.pushSubscriptions?.length > 0) {
              let totalAttended = 0, totalClasses = 0;
              for (const s of user.subjects) {
                totalAttended += (s.totalPresent + s.totalLate);
                totalClasses += s.totalClassesHeld;
              }
              const pct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
              const pushPayload = JSON.stringify({
                title: `📊 Weekly Report: ${pct}% overall`,
                body: `${totalAttended}/${totalClasses} classes attended`,
                tag: "weekly-report",
                data: { url: "/analytics" },
              });
              await sendPushToAll(user.pushSubscriptions, pushPayload);
            }

            await markAsSent(user.id, weeklyKey);
            results.weeklyReports++;
          }
        }
      } catch (userError: any) {
        results.errors.push(`User ${user.id}: ${userError.message}`);
      }
    }

    // Cleanup old sent-notification records (older than 7 days)
    await prisma.sentNotification.deleteMany({
      where: { sentAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
  } catch (error: any) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[Cron] Results:", results);
  return NextResponse.json({ ok: true, ...results });
}

// ===== DUPLICATE PREVENTION =====

async function wasAlreadySent(userId: string, key: string): Promise<boolean> {
  const existing = await prisma.sentNotification.findUnique({
    where: { userId_key: { userId, key } },
  });
  return !!existing;
}

async function markAsSent(userId: string, key: string): Promise<void> {
  await prisma.sentNotification.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, type: key.split(":")[0] },
    update: { sentAt: new Date() },
  });
}

// ===== RETRY LOGIC =====

async function sendWithRetry(
  fn: () => Promise<any>,
  label: string,
  results: { errors: string[] },
  maxRetries = 2
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fn();
      return true;
    } catch (e: any) {
      if (attempt === maxRetries) {
        results.errors.push(`${label}: ${e.message} (after ${maxRetries} attempts)`);
        return false;
      }
      // Wait 1s before retry
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

// ===== PUSH HELPER =====

async function sendPushToAll(subscriptions: any[], payload: string) {
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        .catch((err) => {
          // 410 Gone or 404 = subscription expired, clean up
          if (err.statusCode === 410 || err.statusCode === 404) {
            prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          throw err;
        })
    )
  );
  return results;
}

// ===== TIMEZONE HELPER =====

function getTimeInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";

  const hours = parseInt(get("hour"));
  const minutes = parseInt(get("minute"));

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[get("weekday")] ?? date.getDay();

  // dateKey for dedup: YYYY-MM-DD in user's timezone
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;

  // Human-readable date
  const readableFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dateString = readableFormatter.format(date);

  return { hours, minutes, dayOfWeek, dateKey, dateString };
}

// ===== FORMATTERS =====

function formatDailyBrief(schedules: any[], dateString: string): string {
  let text = `📚 *Today's Classes — ${dateString}*\n\n`;
  for (const s of schedules) {
    text += `🕐 *${s.startTime} - ${s.endTime}*\n`;
    text += `   ${s.subject}${s.code ? ` (${s.code})` : ""}`;
    if (s.room) text += `\n   📍 ${s.room}`;
    text += "\n\n";
  }
  text += `Total: ${schedules.length} class${schedules.length !== 1 ? "es" : ""} today`;
  return text;
}

function formatDailyBriefHTML(schedules: any[], dateString: string): string {
  const rows = schedules
    .map(
      (s) => `
    <tr>
      <td style="padding:8px 12px;color:#06B6D4;font-weight:600;">${s.startTime}-${s.endTime}</td>
      <td style="padding:8px 12px;color:#fff;">${s.subject}${s.code ? ` (${s.code})` : ""}</td>
      <td style="padding:8px 12px;color:#9CA3AF;">${s.room || "-"}</td>
    </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
      <h2 style="color:#7C3AED;margin:0 0 16px;">📚 Today's Classes</h2>
      <p style="color:#9CA3AF;margin:0 0 16px;">${dateString}</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">TIME</th>
            <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">SUBJECT</th>
            <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">ROOM</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#9CA3AF;margin:16px 0 0;font-size:13px;">
        ${schedules.length} class${schedules.length !== 1 ? "es" : ""} today — AttendEase
      </p>
    </div>
  `;
}

function formatPreClassHTML(subjectName: string, minutesUntil: number, schedule: any): string {
  return `
    <div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
      <h2 style="color:#7C3AED;margin:0 0 8px;">⏰ ${subjectName}</h2>
      <p style="font-size:20px;margin:0 0 16px;color:#06B6D4;">Starts in <strong>${minutesUntil} minutes</strong></p>
      <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:12px;">
        <p style="margin:0;color:#fff;">🕐 ${schedule.startTime} - ${schedule.endTime}</p>
        <p style="margin:4px 0 0;color:#9CA3AF;">📍 ${schedule.room || "No room assigned"}</p>
      </div>
      <p style="color:#9CA3AF;margin:16px 0 0;font-size:13px;">Open AttendEase to mark attendance.</p>
    </div>
  `;
}

function formatDangerAlert(subjects: any[]): string {
  let text = `⚠️ *Attendance Alert*\n\n`;
  for (const s of subjects) {
    const pct = s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 0;
    const min = s.minAttendancePct || 75;
    text += `🔴 *${s.name}*: ${pct}% (need ${min}%)\n`;
    text += `   ${s.totalPresent + s.totalLate}/${s.totalClassesHeld} classes attended\n\n`;
  }
  return text;
}

function formatDangerAlertHTML(subjects: any[]): string {
  const rows = subjects
    .map((s) => {
      const pct = s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 0;
      return `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:12px;margin-bottom:8px;">
          <strong style="color:#EF4444;">${s.name}</strong>
          <span style="color:#9CA3AF;margin-left:8px;">${pct}% (need ${s.minAttendancePct || 75}%)</span>
          <div style="color:#9CA3AF;font-size:13px;">${s.totalPresent + s.totalLate}/${s.totalClassesHeld} attended</div>
        </div>`;
    })
    .join("");

  return `
    <div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
      <h2 style="color:#EF4444;margin:0 0 16px;">⚠️ Attendance Alert</h2>
      ${rows}
      <p style="color:#9CA3AF;margin:16px 0 0;font-size:13px;">Open AttendEase to see recovery plan.</p>
    </div>
  `;
}

function formatWeeklyReport(subjects: any[]): string {
  let text = `📊 *Weekly Attendance Report*\n\n`;
  let totalAttended = 0;
  let totalClasses = 0;

  for (const s of subjects) {
    const pct = s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 0;
    const emoji = pct >= 75 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
    text += `${emoji} *${s.name}*: ${pct}% (${s.totalPresent + s.totalLate}/${s.totalClassesHeld})\n`;
    totalAttended += (s.totalPresent + s.totalLate);
    totalClasses += s.totalClassesHeld;
  }

  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  text += `\n📈 *Overall: ${overallPct}%* (${totalAttended}/${totalClasses})`;
  return text;
}

function formatWeeklyReportHTML(subjects: any[]): string {
  let totalAttended = 0;
  let totalClasses = 0;

  const rows = subjects
    .map((s) => {
      const pct = s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 0;
      totalAttended += (s.totalPresent + s.totalLate);
      totalClasses += s.totalClassesHeld;
      const color = pct >= 75 ? "#22C55E" : pct >= 50 ? "#EAB308" : "#EF4444";
      return `
        <tr>
          <td style="padding:8px 12px;color:#fff;">${s.name}</td>
          <td style="padding:8px 12px;color:${color};font-weight:600;">${pct}%</td>
          <td style="padding:8px 12px;color:#9CA3AF;">${s.totalPresent + s.totalLate}/${s.totalClassesHeld}</td>
        </tr>`;
    })
    .join("");

  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  return `
    <div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;max-width:500px;">
      <h2 style="color:#7C3AED;margin:0 0 16px;">📊 Weekly Report</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">SUBJECT</th>
            <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">%</th>
            <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:12px;">ATTENDED</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:16px;padding:12px;background:rgba(124,58,237,0.15);border-radius:12px;text-align:center;">
        <span style="color:#7C3AED;font-size:24px;font-weight:700;">${overallPct}%</span>
        <div style="color:#9CA3AF;font-size:13px;">Overall Attendance</div>
      </div>
    </div>
  `;
}