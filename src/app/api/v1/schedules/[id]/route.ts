import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;

  const existing = await prisma.schedule.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room,
      building: body.building,
      isActive: body.isActive,
    },
  });

  return Response.json({ schedule });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;

  const existing = await prisma.schedule.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.schedule.delete({ where: { id } });
  return Response.json({ success: true });
}
