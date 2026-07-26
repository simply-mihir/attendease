import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendTelegram,
  formatDailyBrief as formatTelegramDailyBrief,
  formatDangerAlert as formatTelegramDangerAlert,
  formatWeeklyReport as formatTelegramWeeklyReport,
} from "@/lib/telegram";
import {
  sendEmail,
  formatDailyBriefEmail,
  formatDangerAlertEmail,
  formatWeeklyReportEmail,
} from "@/lib/email";
import { sendPushNotification } from "@/lib/push";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const isSunday = dayOfWeek === 0;
  const results = { dailyBrief: 0, dangerAlerts: 0, weeklyReport: 0 };

  const briefSettings = await prisma.notificationSetting.findMany({
    where: {
      OR: [
        { telegramEnabled: true, telegramDailyBrief: true },
        { telegramEnabled: true, telegramDangerAlert: true },
        { emailEnabled: true, emailDailyBrief: true },
        { emailEnabled: true, emailDangerAlert: true },
        { pushEnabled: true },
      ],
    },
    include: {
      user: {
        include: {
          schedules: {
            where: { dayOfWeek, isActive: true },
            include: { subject: true },
          },
          subjects: { where: { isArchived: false } },
          pushSubscriptions: true,
        },
      },
    },
  });

  for (const setting of briefSettings) {
    const user = setting.user;
    if (!user.isActive) continue;

    const classes = user.schedules.map((s) => ({
      name: s.subject.name,
      time: `${s.startTime} - ${s.endTime}`,
      room: s.room,
      pct: s.subject.currentPercentage,
    }));
    const totalHeld = user.subjects.reduce((a, s) => a + s.totalClassesHeld, 0);
    const totalPresent = user.subjects.reduce((a, s) => a + s.totalPresent + s.totalLate, 0);
    const overallPct = totalHeld === 0 ? 0 : Math.round((totalPresent / totalHeld) * 100);

    // 1. Daily Briefs
    if (setting.telegramEnabled && setting.telegramDailyBrief && user.telegramChatId) {
      await sendTelegram(user.telegramChatId, formatTelegramDailyBrief(classes, overallPct));
      results.dailyBrief++;
    }
    if (setting.emailEnabled && setting.emailDailyBrief && user.email) {
      const emailContent = formatDailyBriefEmail(classes, overallPct);
      await sendEmail(user.email, emailContent.subject, emailContent.html);
      results.dailyBrief++;
    }

    // 2. Danger Alerts
    for (const subject of user.subjects) {
      if (subject.totalClassesHeld > 0 && subject.currentPercentage < subject.minAttendancePct) {
        const effectivePresent = subject.totalPresent + subject.totalLate;
        const mustAttend = Math.max(0, Math.ceil(
          ((subject.minAttendancePct / 100) * subject.totalClassesHeld - effectivePresent) /
          (1 - subject.minAttendancePct / 100)
        ));

        if (setting.telegramEnabled && setting.telegramDangerAlert && user.telegramChatId) {
          await sendTelegram(
            user.telegramChatId,
            formatTelegramDangerAlert(subject.name, subject.currentPercentage, subject.minAttendancePct, mustAttend)
          );
          results.dangerAlerts++;
        }

        if (setting.emailEnabled && setting.emailDangerAlert && user.email) {
          const emailContent = formatDangerAlertEmail(subject.name, subject.currentPercentage, subject.minAttendancePct, mustAttend);
          await sendEmail(user.email, emailContent.subject, emailContent.html);
          results.dangerAlerts++;
        }
      }
    }

    // 3. Web Push Notifications
    if (setting.pushEnabled && user.pushSubscriptions.length > 0) {
      const classCount = user.schedules.length;
      for (const sub of user.pushSubscriptions) {
        await sendPushNotification(sub, {
          title: "Good morning! ☀️",
          body: classCount > 0 ? `You have ${classCount} class${classCount > 1 ? "es" : ""} today` : "No classes today!",
          icon: "/icons/icon-192.png",
          data: { url: "/dashboard" },
        });
      }
    }
  }

  // 4. Sunday Weekly Report
  if (isSunday) {
    const weeklySettings = await prisma.notificationSetting.findMany({
      where: {
        OR: [
          { telegramEnabled: true, telegramWeeklyReport: true },
          { emailEnabled: true, emailWeeklyReport: true },
        ],
      },
      include: { user: { include: { subjects: { where: { isArchived: false } } } } },
    });

    for (const setting of weeklySettings) {
      const user = setting.user;
      if (!user.isActive) continue;

      const stats = user.subjects.map((s) => ({
        name: s.name, pct: s.currentPercentage, attended: s.totalPresent + s.totalLate, total: s.totalClassesHeld,
      }));
      const totalHeld = user.subjects.reduce((a, s) => a + s.totalClassesHeld, 0);
      const totalPresent = user.subjects.reduce((a, s) => a + s.totalPresent + s.totalLate, 0);
      const overallPct = totalHeld === 0 ? 0 : Math.round((totalPresent / totalHeld) * 100);

      if (setting.telegramEnabled && setting.telegramWeeklyReport && user.telegramChatId) {
        await sendTelegram(user.telegramChatId, formatTelegramWeeklyReport(stats, overallPct));
        results.weeklyReport++;
      }

      if (setting.emailEnabled && setting.emailWeeklyReport && user.email) {
        const emailContent = formatWeeklyReportEmail(stats, overallPct);
        await sendEmail(user.email, emailContent.subject, emailContent.html);
        results.weeklyReport++;
      }
    }
  }

  return NextResponse.json({ ok: true, ...results, time: now.toISOString() });
}