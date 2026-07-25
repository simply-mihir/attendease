import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsApp, formatPreClassReminder, formatDangerAlert } from "@/lib/twilio";
import { sendPushNotification } from "@/lib/push";
import { calculateAttendance } from "@/lib/attendance-calc";

// Vercel Cron: runs every 5 minutes to check for upcoming classes
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Get all active notification settings
  const settings = await prisma.notificationSetting.findMany({
    where: {
      OR: [
        { whatsappEnabled: true, whatsappPreClass: true },
        { alarmEnabled: true, alarmPreClass: true },
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
          pushSubscriptions: true,
        },
      },
    },
  });

  let sent = 0;

  for (const setting of settings) {
    const user = setting.user;
    if (!user.isActive) continue;

    for (const schedule of user.schedules) {
      const [h, m] = schedule.startTime.split(":").map(Number);
      const classMinutes = h * 60 + m;

      // Check WhatsApp pre-class reminder
      if (setting.whatsappEnabled && setting.whatsappPreClass && user.whatsappNumber) {
        const reminderTime = classMinutes - setting.whatsappBeforeMinutes;
        if (currentMinutes >= reminderTime && currentMinutes < reminderTime + 5) {
          const stats = calculateAttendance(
            schedule.subject.totalClassesHeld,
            schedule.subject.totalPresent + schedule.subject.totalLate,
            schedule.subject.minAttendancePct
          );

          // Check quiet hours
          if (!isQuietHours(setting, now)) {
            await sendWhatsApp(
              user.whatsappNumber,
              formatPreClassReminder(
                schedule.subject.name,
                schedule.startTime,
                schedule.room,
                stats.currentPercentage,
                schedule.subject.minAttendancePct
              )
            );
            sent++;
          }
        }
      }

      // Check push notification reminder
      if (setting.pushEnabled && user.pushSubscriptions.length > 0) {
        const reminderTime = classMinutes - (setting.alarmBeforeMinutes || 10);
        if (currentMinutes >= reminderTime && currentMinutes < reminderTime + 5) {
          if (!isQuietHours(setting, now)) {
            for (const sub of user.pushSubscriptions) {
              await sendPushNotification(sub, {
                title: `${schedule.subject.name} in ${setting.alarmBeforeMinutes} min`,
                body: `${schedule.startTime}${schedule.room ? ` — ${schedule.room}` : ""}`,
                icon: "/icons/icon-192.png",
                badge: "/icons/badge-72.png",
                tag: `class-${schedule.id}`,
                data: { url: "/dashboard" },
              });
            }
            sent++;
          }
        }
      }

      // Danger alert (check once per class)
      if (setting.whatsappEnabled && setting.whatsappDangerAlert && user.whatsappNumber) {
        const stats = calculateAttendance(
          schedule.subject.totalClassesHeld,
          schedule.subject.totalPresent + schedule.subject.totalLate,
          schedule.subject.minAttendancePct
        );
        if (stats.currentPercentage < schedule.subject.minAttendancePct && currentMinutes === classMinutes) {
          if (!isQuietHours(setting, now)) {
            await sendWhatsApp(
              user.whatsappNumber,
              formatDangerAlert(
                schedule.subject.name,
                stats.currentPercentage,
                schedule.subject.minAttendancePct,
                stats.mustAttendCount
              )
            );
            sent++;
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, time: now.toISOString() });
}

function isQuietHours(setting: any, now: Date): boolean {
  if (!setting.quietHoursEnabled) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = setting.quietHoursStart.split(":").map(Number);
  const [endH, endM] = setting.quietHoursEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight quiet hours (e.g. 22:00 - 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}
