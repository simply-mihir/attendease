import { NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cachedJson } from "@/lib/api-cache";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  // 3 parallel queries instead of 2 sequential API calls with 4 queries total
  const [subjects, todayRecords, schedules] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: user.id, isArchived: false },
      select: {
        id: true,
        name: true,
        code: true,
        colorHex: true,
        icon: true,
        totalClassesHeld: true,
        totalPresent: true,
        totalLate: true,
        totalAbsent: true,
        minAttendancePct: true,
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        subject: { userId: user.id },
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: { subjectId: true, status: true, id: true },
    }),
    prisma.schedule.findMany({
      where: {
        subject: { userId: user.id, isArchived: false },
        dayOfWeek,
      },
      include: {
        subject: {
          select: { id: true, name: true, colorHex: true, icon: true, code: true },
        },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  // Build today's schedule with attendance status
  const todaySchedule = schedules.map((s) => ({
    ...s,
    attendance: todayRecords.find((r) => r.subjectId === s.subjectId) || null,
  }));

  // Stats
  const totalClasses = subjects.reduce((sum, s) => sum + s.totalClassesHeld, 0);
  const totalAttended = subjects.reduce((sum, s) => sum + s.totalPresent + s.totalLate, 0);
  const overallAttendance = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

  const dangerSubjects = subjects.filter((s) => {
    const pct = s.totalClassesHeld > 0 ? ((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100 : 100;
    return pct < (s.minAttendancePct || 75);
  });

  return cachedJson({
    todaySchedule,
    subjects,
    stats: {
      totalSubjects: subjects.length,
      totalClasses,
      overallAttendance,
      dangerCount: dangerSubjects.length,
    },
    dangerSubjects,
  }, 15);
}
