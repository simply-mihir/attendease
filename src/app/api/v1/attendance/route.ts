import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { markAttendanceSchema } from "@/lib/validations/subject";

import { recalcSubjectStats } from "@/lib/subject-stats";
import { notifyAttendanceMarked, notifyAttendanceFailed } from "@/lib/attendance-notifier";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const subjectId = url.searchParams.get("subjectId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { userId: user.id };
  if (subjectId) where.subjectId = subjectId;
  if (status) where.status = status;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: { subject: { select: { name: true, colorHex: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });

  return Response.json({ records });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = markAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { subjectId, date, status, scheduleId, notes, source } = parsed.data;

    // Verify subject belongs to user
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.id },
    });
    if (!subject) {
      // notify failure async (don't await)
      await notifyAttendanceFailed(user.id, "Unknown Subject", "Subject not found or you don't have permission.");
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        subjectId_userId_date_scheduleId: {
          subjectId,
          userId: user.id,
          date: new Date(date),
          scheduleId: scheduleId || "",
        },
      },
      create: {
        subjectId,
        userId: user.id,
        scheduleId: scheduleId || null,
        date: new Date(date),
        status,
        source: source || "manual",
        notes,
      },
      update: {
        status,
        notes,
        editedAt: new Date(),
        editedReason: "Updated via mark",
      },
    });

    const updatedStats = await recalcSubjectStats(subjectId);
    
    // notify success async (don't await)
    await notifyAttendanceMarked(user.id, subject.name, status, date);

    return Response.json({ record, updatedStats }, { status: 201 });
  } catch (error: any) {
    console.error("Mark attendance error:", error);
    // Best effort generic failure notification
    await notifyAttendanceFailed(user.id, "Unknown Subject", error?.message || "Internal server error during marking.");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
