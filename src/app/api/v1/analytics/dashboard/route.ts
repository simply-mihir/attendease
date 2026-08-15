import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance } from "@/lib/attendance-calc";
import { cachedJson, serverCache } from "@/lib/api-cache";
import { calcOverallStreak } from "@/lib/streak-calc";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const searchParams = req.nextUrl.searchParams;
  const semesterId = searchParams.get("semesterId");

  let isCurrentSemester = true;
  let semesterName: string | null = null;

  const whereClause: any = { userId: user.id, isArchived: false };
  if (semesterId) {
    whereClause.semesterId = semesterId;
    const sem = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (sem) {
      isCurrentSemester = sem.isCurrent;
      semesterName = sem.name;
    }
  }

  const [subjects, currentStreak] = await Promise.all([
    prisma.subject.findMany({
      where: whereClause,
      include: {
        schedules: { where: { isActive: true } },
      },
      orderBy: { name: "asc" },
    }),
    serverCache(`streak:${user.id}`, 30, () => calcOverallStreak(user.id)),
  ]);

  let overallPresent = 0;
  let overallTotal = 0;
  let longestStreak = 0;
  let safeSubjects = 0;
  let warningSubjects = 0;
  let dangerSubjects = 0;

  const subjectsSummary = subjects.map((s) => {
    const stats = calculateAttendance({
      totalClasses: s.totalClassesHeld,
      totalPresent: s.totalPresent,
      totalLate: s.totalLate,
      totalAbsent: s.totalAbsent,
      totalExcused: s.totalExcused,
      minRequiredPct: s.minAttendancePct,
    });

    overallPresent += s.totalPresent + s.totalLate;
    overallTotal += s.totalClassesHeld;
    if (s.longestStreak > longestStreak) longestStreak = s.longestStreak;
    if (stats.statusColor === "green") safeSubjects++;
    else if (stats.statusColor === "yellow") warningSubjects++;
    else dangerSubjects++;

    return {
      id: s.id,
      name: s.name,
      code: s.code,
      colorHex: s.colorHex,
      ...stats,
      streakCount: s.streakCount,
      totalClasses: s.totalClassesHeld,
      totalCancelled: s.totalCancelled,
      minAttendancePct: s.minAttendancePct,
    };
  });

  const overallPct = overallTotal === 0 ? 0 : Math.round((overallPresent / overallTotal) * 10000) / 100;

  return cachedJson({
    overallPct,
    totalSubjects: subjects.length,
    safeSubjects,
    warningSubjects,
    dangerSubjects,
    currentStreak,
    longestStreak,
    subjectsSummary,
    isCurrentSemester,
    semesterName,
    userName: user.name,
  }, 15);
}
