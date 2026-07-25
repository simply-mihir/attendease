import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsApp, formatDailyBrief } from "@/lib/twilio";
import { sendPushNotification } from "@/lib/push";

// Vercel Cron: runs at user's dailyBriefTime to send morning brief
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dayOfWeek = now.getDay();

  // Find users whose daily brief time matches current time (±2 min window)
  const settings = await prisma.notificationSetting.findMany({
    where: {
      whatsappDailyBrief: true,
      whatsappEnabled: true,
      dailyBriefTime: currentHHMM,
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

  let sent = 0;

  for (const setting of settings) {
    const user = setting.user;
    if (!user.isActive || !user.whatsappNumber) continue;

    const classes = user.schedules.map((s) => ({
      name: s.subject.name,
      time: `${s.startTime} - ${s.endTime}`,
      room: s.room,
      pct: s.subject.currentPercentage,
    }));

    const totalHeld = user.subjects.reduce((a, s) => a + s.totalClassesHeld, 0);
    const totalPresent = user.subjects.reduce((a, s) => a + s.totalPresent + s.totalLate, 0);
    const overallPct = totalHeld === 0 ? 0 : Math.round((totalPresent / totalHeld) * 100);

    await sendWhatsApp(user.whatsappNumber, formatDailyBrief(classes, overallPct));
    sent++;

    // Also send push notification
    for (const sub of user.pushSubscriptions) {
      await sendPushNotification(sub, {
        title: "Good morning! ☀️",
        body: classes.length > 0 ? `You have ${classes.length} classes today` : "No classes today!",
        icon: "/icons/icon-192.png",
        data: { url: "/dashboard" },
      });
    }
  }

  return NextResponse.json({ ok: true, sent });
}
