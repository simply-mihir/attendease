import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const subject = await prisma.subject.findFirst({
    where: { id, userId: user.id },
    include: {
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      attendanceRecords: { orderBy: { date: "desc" }, take: 60 },
      semester: { select: { name: true } },
    },
  });

  if (!subject) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ subject });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const existing = await prisma.subject.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const subject = await prisma.subject.update({
    where: { id },
    data: {
      name: body.name,
      code: body.code,
      instructorName: body.instructorName,
      minAttendancePct: body.minAttendancePct,
      colorHex: body.colorHex,
      icon: body.icon,
      semesterId: body.semesterId,
      reminderEnabled: body.reminderEnabled,
      reminderBeforeMin: body.reminderBeforeMin,
      isArchived: body.isArchived,
      archiveReason: body.archiveReason,
    },
    include: { schedules: true },
  });

  return Response.json({ subject });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const existing = await prisma.subject.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.subject.delete({ where: { id } });
  return Response.json({ success: true });
}
