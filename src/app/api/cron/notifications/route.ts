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
export const maxDuration = 30; // seconds

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
  const currentUTCHour = now.getUTCHours();
  const currentUTCMinute = now.getUTCMinutes();
  const currentDayOfWeek = now.getDay(); // 0=Sunday
  const isRunningAsHourly = currentUTCMinute < 35; // Allow 35-min window for cron drift

  const results = {
    dailyBriefs: 0,
    dangerAlerts: 0,
    preClassReminders: 0,
    weeklyReports: 0,
    errors: [] as string[],
  };

  try {
    // ===== 1. DAILY BRIEFS — Send to users whose preferred time matches current UTC hour =====
    
    // Get all users with notification settings
    const usersWithSettings = await prisma.user.findMany({
      where: {
        OR: [
          { notificationSetting: { telegramDailyBrief: true, telegramEnabled: true } },
          { notificationSetting: { emailDailyBrief: true, emailEnabled: true } },
          { notificationSetting: { pushEnabled: true } },
        ],
      },
      include: {
        notificationSetting: true,
        subjects: {
          where: { isArchived: false },
          include: {
            schedules: true,
          },
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

        const briefHour = settings.dailyBriefHour ?? 7;
        const briefMinute = settings.dailyBriefMinute ?? 0;

        // Check if it's time for this user's daily brief (within 30-min window)
        const isBriefTime =
          userHour === briefHour &&
          userMinute >= briefMinute &&
          userMinute < briefMinute + 30;

        // ---- Daily Brief ----
        if (isBriefTime) {
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

            // Telegram
            if (settings.telegramEnabled && settings.telegramDailyBrief && user.telegramChatId) {
              await sendTelegram(user.telegramChatId, briefText).catch((e) =>
                results.errors.push(`Telegram brief ${user.id}: ${e.message}`)
              );
            }

            // Email
            if (settings.emailEnabled && settings.emailDailyBrief && user.email) {
              await sendEmail(
                user.email,
                `📚 Today's Classes — ${userNow.dateString}`,
                formatDailyBriefHTML(todaySchedules, userNow.dateString)
              ).catch((e) =>
                results.errors.push(`Email brief ${user.id}: ${e.message}`)
              );
            }

            // Push
            if (settings.pushEnabled && user.pushSubscriptions?.length > 0) {
              const pushPayload = JSON.stringify({
                title: `📚 Today: ${todaySchedules.length} classes`,
                body: todaySchedules.map((s) => `${s.startTime} ${s.subject}`).join(", "),
                tag: "daily-brief",
                data: { url: "/dashboard" },
              });

              for (const sub of user.pushSubscriptions) {
                await webpush
                  .sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    pushPayload
                  )
                  .catch(() => {
                    // Remove invalid subscription
                    prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                  });
              }
            }

            results.dailyBriefs++;
          }
        }

        // ---- Pre-Class Reminders (server-side push) ----
        // Check if any class starts within the next 15-30 minutes for this user
        const reminderBefore = settings.telegramBeforeMinutes ?? 15;

        for (const subject of user.subjects) {
          for (const schedule of subject.schedules) {
            if (schedule.dayOfWeek !== userDayOfWeek) continue;

            const [schedHour, schedMin] = schedule.startTime.split(":").map(Number);
            const minutesUntilClass = (schedHour - userHour) * 60 + (schedMin - userMinute);

            // Send reminder if class is within the reminder window (e.g., 15 min)
            // Only send if we're within a 30-min check window to avoid duplicates
            if (minutesUntilClass > 0 && minutesUntilClass <= reminderBefore && minutesUntilClass > reminderBefore - 30) {
              const reminderText = `⏰ *${subject.name}* starts in ${minutesUntilClass} min\n📍 ${schedule.room || "No room"} | ${schedule.startTime} - ${schedule.endTime}`;

              // Telegram pre-class reminder
              if (settings.telegramEnabled && settings.telegramPreClass && user.telegramChatId) {
                await sendTelegram(user.telegramChatId, reminderText).catch((e) =>
                  results.errors.push(`Telegram reminder ${user.id}: ${e.message}`)
                );
              }

              // Email pre-class reminder
              if (settings.emailEnabled && settings.emailPreClass && user.email) {
                await sendEmail(
                  user.email,
                  `⏰ ${subject.name} in ${minutesUntilClass} min`,
                  `<div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:24px;border-radius:16px;">
                    <h2 style="color:#7C3AED;">${subject.name}</h2>
                    <p>Starts in <strong>${minutesUntilClass} minutes</strong></p>
                    <p>📍 ${schedule.room || "No room assigned"}</p>
                    <p>🕐 ${schedule.startTime} - ${schedule.endTime}</p>
                  </div>`
                ).catch((e) =>
                  results.errors.push(`Email reminder ${user.id}: ${e.message}`)
                );
              }

              // Push pre-class reminder with action buttons
              if (settings.pushEnabled && user.pushSubscriptions?.length > 0) {
                const quickMarkToken = generateQuickMarkToken(user.id, schedule.id);
                const pushPayload = JSON.stringify({
                  title: `${subject.name} in ${minutesUntilClass} min`,
                  body: `${schedule.startTime} - ${schedule.endTime}${schedule.room ? ` • ${schedule.room}` : ""}`,
                  tag: `pre-class-${schedule.id}`,
                  data: {
                    scheduleId: schedule.id,
                    subjectId: subject.id,
                    subjectName: subject.name,
                    userId: user.id,
                    quickMarkToken,
                    url: "/dashboard",
                  },
                });

                for (const sub of user.pushSubscriptions) {
                  await webpush
                    .sendNotification(
                      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                      pushPayload
                    )
                    .catch(() => {
                      prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                    });
                }
              }

              results.preClassReminders++;
            }
          }
        }

        // ---- Danger Alerts ----
        // Send once daily at brief time for subjects below minimum attendance
        if (isBriefTime) {
          const dangerSubjects = user.subjects.filter((sub) => {
            if (sub.totalClassesHeld === 0) return false;
            const pct = (sub.totalPresent + sub.totalLate) / sub.totalClassesHeld * 100;
            return pct < (sub.minAttendancePct || 75);
          });

          if (dangerSubjects.length > 0) {
            const dangerText = formatDangerAlert(dangerSubjects);

            if (settings.telegramEnabled && settings.telegramDangerAlert && user.telegramChatId) {
              await sendTelegram(user.telegramChatId, dangerText).catch((e) =>
                results.errors.push(`Telegram danger ${user.id}: ${e.message}`)
              );
            }

            if (settings.emailEnabled && settings.emailDangerAlert && user.email) {
              await sendEmail(
                user.email,
                `⚠️ Attendance Alert — ${dangerSubjects.length} subjects in danger`,
                formatDangerAlertHTML(dangerSubjects)
              ).catch((e) =>
                results.errors.push(`Email danger ${user.id}: ${e.message}`)
              );
            }

            results.dangerAlerts++;
          }
        }

        // ---- Weekly Report (Sunday at brief time) ----
        if (isBriefTime && userDayOfWeek === 0) {
          if (settings.telegramEnabled && settings.telegramWeeklyReport && user.telegramChatId) {
            const reportText = formatWeeklyReport(user.subjects);
            await sendTelegram(user.telegramChatId, reportText).catch((e) =>
              results.errors.push(`Telegram weekly ${user.id}: ${e.message}`)
            );
          }

          if (settings.emailEnabled && settings.emailWeeklyReport && user.email) {
            const reportHTML = formatWeeklyReportHTML(user.subjects);
            await sendEmail(user.email, "📊 Weekly Attendance Report", reportHTML).catch((e) =>
              results.errors.push(`Email weekly ${user.id}: ${e.message}`)
            );
          }

          results.weeklyReports++;
        }
      } catch (userError: any) {
        results.errors.push(`User ${user.id}: ${userError.message}`);
      }
    }
  } catch (error: any) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[Cron] Results:", results);
  return NextResponse.json({ ok: true, ...results });
}

// ===== HELPER FUNCTIONS =====

function getTimeInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
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

  const dateString = `${get("month")} ${get("day")}, ${get("year")}`;

  return { hours, minutes, dayOfWeek, dateString };
}

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
    const attended = s.totalPresent + s.totalLate;
    const pct = s.totalClassesHeld > 0 ? Math.round((attended / s.totalClassesHeld) * 100) : 0;
    const emoji = pct >= 75 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
    text += `${emoji} *${s.name}*: ${pct}% (${attended}/${s.totalClassesHeld})\n`;
    totalAttended += attended;
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
      const attended = s.totalPresent + s.totalLate;
      const pct = s.totalClassesHeld > 0 ? Math.round((attended / s.totalClassesHeld) * 100) : 0;
      totalAttended += attended;
      totalClasses += s.totalClassesHeld;
      const color = pct >= 75 ? "#22C55E" : pct >= 50 ? "#EAB308" : "#EF4444";
      return `
        <tr>
          <td style="padding:8px 12px;color:#fff;">${s.name}</td>
          <td style="padding:8px 12px;color:${color};font-weight:600;">${pct}%</td>
          <td style="padding:8px 12px;color:#9CA3AF;">${attended}/${s.totalClassesHeld}</td>
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