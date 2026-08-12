import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    // Single query with include
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        timezone: true,
        notificationSetting: true,
      },
    });

    let settings = userData?.notificationSetting;

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.notificationSetting.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json(
      { ...settings, timezone: userData?.timezone || "Asia/Kolkata" },
      {
        headers: {
          "Cache-Control": "private, max-age=0, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("[Settings] GET error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { timezone, ...notifSettings } = body;

    // Update timezone on User model if provided
    if (timezone && typeof timezone === "string") {
      try {
        Intl.DateTimeFormat("en-US", { timeZone: timezone });
        await prisma.user.update({
          where: { id: user.id },
          data: { timezone },
        });
      } catch {
        // Invalid timezone — skip silently
      }
    }

    // Filter to only valid NotificationSetting fields
    const validFields = [
      "pushEnabled", "emailEnabled", "telegramEnabled",
      "pushDailyBrief", "pushPreClass", "pushDangerAlert", "pushWeeklyReport", "pushDailyReport",
      "emailDailyBrief", "emailPreClass", "emailDangerAlert", "emailWeeklyReport", "emailDailyReport",
      "telegramDailyBrief", "telegramPreClass", "telegramDangerAlert", "telegramWeeklyReport", "telegramDailyReport",
      "dailyBriefHour", "dailyBriefMinute", "dailyReportHour", "dailyReportMinute", "preClassMinutes",
      "goalModeEnabled", "goalType", "goalSetupComplete", "goalTargetPct",
    ];

    const updateData: Record<string, any> = {};
    for (const key of validFields) {
      if (key in notifSettings) {
        updateData[key] = notifSettings[key];
      }
    }

    // Upsert: create if doesn't exist, update if it does
    const updated = await prisma.notificationSetting.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...updateData },
      update: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Settings] PUT error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
