import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsApp, formatWeeklyReport } from "@/lib/twilio";

// Vercel Cron: runs every Sunday at 10:00 AM
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.notificationSetting.findMany({
    where: {
      whatsappEnabled: true,
      whatsappWeeklyReport: true,
    },
    include: {
      user: {
        include: {
          subjects: { where: { isArchived: false } },
        },
      },
    },
  });

  let sent = 0;

  for (const setting of settings) {
    const user = setting.user;
    if (!user.isActive || !user.whatsappNumber) continue;

    const stats = user.subjects.map((s) => ({
      name: s.name,
      pct: s.currentPercentage,
      attended: s.totalPresent + s.totalLate,
      total: s.totalClassesHeld,
    }));

    const totalHeld = user.subjects.reduce((a, s) => a + s.totalClassesHeld, 0);
    const totalPresent = user.subjects.reduce((a, s) => a + s.totalPresent + s.totalLate, 0);
    const overallPct = totalHeld === 0 ? 0 : Math.round((totalPresent / totalHeld) * 100);

    await sendWhatsApp(user.whatsappNumber, formatWeeklyReport(stats, overallPct));
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
