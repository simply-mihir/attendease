import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
    sendWhatsApp,
    formatDailyBrief,
    formatDangerAlert,
    formatWeeklyReport,
} from "@/lib/twilio";
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
                { whatsappEnabled: true, whatsappDailyBrief: true },
                { whatsappEnabled: true, whatsappDangerAlert: true },
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

        if (setting.whatsappEnabled && setting.whatsappDailyBrief && user.whatsappNumber) {
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
            results.dailyBrief++;
        }

        if (setting.whatsappEnabled && setting.whatsappDangerAlert && user.whatsappNumber) {
            for (const subject of user.subjects) {
                if (subject.totalClassesHeld > 0 && subject.currentPercentage < subject.minAttendancePct) {
                    const effectivePresent = subject.totalPresent + subject.totalLate;
                    const mustAttend = Math.ceil(
                        ((subject.minAttendancePct / 100) * subject.totalClassesHeld - effectivePresent) /
                        (1 - subject.minAttendancePct / 100)
                    );
                    await sendWhatsApp(
                        user.whatsappNumber,
                        formatDangerAlert(subject.name, subject.currentPercentage, subject.minAttendancePct, Math.max(0, mustAttend))
                    );
                    results.dangerAlerts++;
                }
            }
        }

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

    if (isSunday) {
        const weeklySettings = await prisma.notificationSetting.findMany({
            where: { whatsappEnabled: true, whatsappWeeklyReport: true },
            include: { user: { include: { subjects: { where: { isArchived: false } } } } },
        });
        for (const setting of weeklySettings) {
            const user = setting.user;
            if (!user.isActive || !user.whatsappNumber) continue;
            const stats = user.subjects.map((s) => ({
                name: s.name, pct: s.currentPercentage, attended: s.totalPresent + s.totalLate, total: s.totalClassesHeld,
            }));
            const totalHeld = user.subjects.reduce((a, s) => a + s.totalClassesHeld, 0);
            const totalPresent = user.subjects.reduce((a, s) => a + s.totalPresent + s.totalLate, 0);
            const overallPct = totalHeld === 0 ? 0 : Math.round((totalPresent / totalHeld) * 100);
            await sendWhatsApp(user.whatsappNumber, formatWeeklyReport(stats, overallPct));
            results.weeklyReport++;
        }
    }

    return NextResponse.json({ ok: true, ...results, time: now.toISOString() });
}