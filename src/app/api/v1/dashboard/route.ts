import { NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cachedJson } from "@/lib/api-cache";
import { calcOverallStreak } from "@/lib/streak-calc";
import { getUserTimezone, getUserToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  // Use user's timezone to determine "today" correctly
  const tz = await getUserTimezone(user.id);
  const { dayOfWeek, dateStr } = getUserToday(tz);
  // AttendanceRecord.date is @db.Date (no time component), so use exact date match
  const todayDateForQuery = new Date(dateStr);

  const activeSemester = await prisma.semester.findFirst({
    where: { userId: user.id, isCurrent: true },
    include: { holidays: true, examPeriods: true },
  });

  // 6 parallel queries including overall streak and orphan count
  const [dbUser, subjects, todayRecords, schedules, currentStreak, orphanCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    }),
    prisma.subject.findMany({
      where: { 
        userId: user.id, 
        isArchived: false,
        ...(activeSemester ? { semesterId: activeSemester.id } : {})
      },
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
        currentPercentage: true,
        streakCount: true,
        longestStreak: true,
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        subject: { userId: user.id },
        date: todayDateForQuery,
      },
      select: { subjectId: true, status: true, id: true, scheduleId: true },
    }),
    prisma.schedule.findMany({
      where: {
        subject: { userId: user.id, isArchived: false },
        dayOfWeek,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            colorHex: true,
            icon: true,
            code: true,
            currentPercentage: true,
            minAttendancePct: true,
            totalClassesHeld: true,
            totalPresent: true,
            totalLate: true,
            streakCount: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    calcOverallStreak(user.id),
    prisma.subject.count({
      where: { userId: user.id, semesterId: null },
    }),
  ]);

  const userName = dbUser?.name || user.name || "Student";

  // Build subjects with computed stats
  const subjectsWithStats = subjects.map((s) => {
    const pct = s.totalClassesHeld > 0 ? s.currentPercentage : 100;
    const min = s.minAttendancePct || 75;
    const buffer = pct - min;
    return {
      ...s,
      currentPercentage: pct,
      statusColor: buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red",
      statusLabel: buffer >= 0 ? "On track" : "Action needed",
      canSkipCount: Math.max(0, Math.floor((s.totalPresent + s.totalLate - (min / 100) * s.totalClassesHeld) / (min / 100))),
      mustAttendCount: Math.max(0, Math.ceil(((min / 100) * s.totalClassesHeld - (s.totalPresent + s.totalLate)) / (1 - min / 100))),
    };
  });

  // Build today's schedule with complete attendance status and stats
  const todaySchedule = schedules.map((s) => {
    const record = todayRecords.find((r) => r.subjectId === s.subjectId && (!r.scheduleId || r.scheduleId === s.id)) || todayRecords.find((r) => r.subjectId === s.subjectId) || null;
    const pct = s.subject.totalClassesHeld > 0 ? s.subject.currentPercentage : 100;
    const min = s.subject.minAttendancePct || 75;
    const buffer = pct - min;
    return {
      ...s,
      scheduleId: s.id,
      subjectId: s.subject.id,
      subjectName: s.subject.name,
      colorHex: s.subject.colorHex,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      currentPct: pct,
      minPct: min,
      statusColor: buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red",
      streakCount: s.subject.streakCount,
      attendanceMarked: !!record,
      attendanceStatus: record?.status || null,
      attendance: record,
    };
  });

  // Stats
  const totalClasses = subjects.reduce((sum, s) => sum + s.totalClassesHeld, 0);
  const totalAttended = subjects.reduce((sum, s) => sum + s.totalPresent + s.totalLate, 0);
  const overallAttendance = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;
  const longestStreak = subjects.reduce((max, s) => Math.max(max, s.longestStreak), 0);

  const dangerSubjects = subjectsWithStats.filter((s) => s.currentPercentage < (s.minAttendancePct || 75));

  return cachedJson({
    userName,
    currentStreak,
    longestStreak,
    todaySchedule,
    subjects: subjectsWithStats,
    stats: {
      totalSubjects: subjects.length,
      totalClasses,
      totalAttended,
      overallAttendance,
      dangerCount: dangerSubjects.length,
    },
    dangerSubjects,
    isCurrentSemester: activeSemester ? true : false,
    semesterName: activeSemester?.name || null,
    activeSemester,
    orphanCount,
  }, 15);
}
