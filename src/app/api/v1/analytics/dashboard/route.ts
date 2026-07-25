import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance } from "@/lib/attendance-calc";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, isArchived: false },
    include: {
      schedules: { where: { isActive: true } },
    },
    orderBy: { name: "asc" },
  });

  let overallPresent = 0;
  let overallTotal = 0;
  let currentStreak = 0;
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
    if (s.streakCount > currentStreak) currentStreak = s.streakCount;
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
      minAttendancePct: s.minAttendancePct,
    };
  });

  const overallPct = overallTotal === 0 ? 0 : Math.round((overallPresent / overallTotal) * 10000) / 100;

  return Response.json({
    overallPct,
    totalSubjects: subjects.length,
    safeSubjects,
    warningSubjects,
    dangerSubjects,
    currentStreak,
    longestStreak,
    subjectsSummary,
  });
}
