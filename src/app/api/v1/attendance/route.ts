import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { markAttendanceSchema } from "@/lib/validations/subject";

async function recalcSubjectStats(subjectId: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: { subjectId },
  });

  const countable = records.filter((r) => r.status !== "holiday");
  const totalClassesHeld = countable.length;
  const totalPresent = countable.filter((r) => r.status === "present").length;
  const totalAbsent = countable.filter((r) => r.status === "absent").length;
  const totalLate = countable.filter((r) => r.status === "late").length;
  const totalExcused = countable.filter((r) => r.status === "excused").length;

  const effective = totalPresent + totalLate;
  const nonCancelled = countable.filter(
    (r) => r.status !== "cancelled"
  ).length;
  const currentPercentage =
    nonCancelled === 0 ? 0 : Math.round((effective / nonCancelled) * 10000) / 100;

  // Calculate streak
  const sorted = records
    .filter((r) => !["holiday", "cancelled"].includes(r.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streakCount = 0;
  for (const rec of sorted) {
    if (rec.status === "present" || rec.status === "late") {
      streakCount++;
    } else break;
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  const longestStreak = Math.max(streakCount, subject?.longestStreak ?? 0);

  await prisma.subject.update({
    where: { id: subjectId },
    data: {
      totalClassesHeld,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      currentPercentage,
      streakCount,
      longestStreak,
    },
  });

  return { totalClassesHeld, totalPresent, totalAbsent, totalLate, totalExcused, currentPercentage, streakCount };
}

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
    if (!subject) return Response.json({ error: "Subject not found" }, { status: 404 });

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
    return Response.json({ record, updatedStats }, { status: 201 });
  } catch (error) {
    console.error("Mark attendance error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
