import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  let settings = await prisma.notificationSetting.findUnique({ where: { userId: user.id } });
  if (!settings) {
    settings = await prisma.notificationSetting.create({ data: { userId: user.id } });
  }
  
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { timezone: true } });
  
  return Response.json({ settings: { ...settings, timezone: dbUser?.timezone || "Asia/Kolkata" } });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const body = await req.json();

  const { 
    timezone, 
    alarmEnabled, alarmPreClass, alarmDangerThreshold, alarmSound, alarmVibrate, alarmBeforeMinutes,
    ...settingsBody 
  } = body;

  if (timezone) {
    await prisma.user.update({
      where: { id: user.id },
      data: { timezone },
    });
  }

  const settings = await prisma.notificationSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...settingsBody },
    update: settingsBody,
  });
  return Response.json({ settings, timezone });
}
