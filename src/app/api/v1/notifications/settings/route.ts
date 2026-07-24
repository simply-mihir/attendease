import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();

  let settings = await prisma.notificationSetting.findUnique({ where: { userId: user.id } });
  if (!settings) {
    settings = await prisma.notificationSetting.create({ data: { userId: user.id } });
  }
  return Response.json({ settings });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  const body = await req.json();

  const settings = await prisma.notificationSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body },
    update: body,
  });
  return Response.json({ settings });
}
