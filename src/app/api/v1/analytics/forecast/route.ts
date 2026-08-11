import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance } from "@/lib/attendance-calc";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  // Get current semester end date
  const currentSemester = await prisma.semester.findFirst({
    where: { userId: user.id, isCurrent: true },
  });

  const semesterEnd = currentSemester
    ? new Date(currentSemester.endDate)
    : new Date(Date.now() + 120 * 24 * 60 * 60 * 1000); // 4 months default

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, isArchived: false },
    include: {
      schedules: { where: { isActive: true } },
      attendanceRecords: {
        where: {
          status: { notIn: ["holiday", "cancelled"] },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  const forecasts = subjects.map((subject) => {
    const stats = calculateAttendance({
      totalClasses: subject.totalClassesHeld,
      totalPresent: subject.totalPresent,
      totalLate: subject.totalLate,
      totalAbsent: subject.totalAbsent,
      totalExcused: subject.totalExcused,
      minRequiredPct: subject.minAttendancePct,
    });

    // Calculate per-day-of-week attendance rates
    const dayStats: Record<number, { total: number; present: number }> = {};
    for (let d = 0; d < 7; d++) {
      dayStats[d] = { total: 0, present: 0 };
    }

    for (const record of subject.attendanceRecords) {
      const day = new Date(record.date).getDay();
      dayStats[day].total++;
      if (record.status === "present" || record.status === "late") {
        dayStats[day].present++;
      }
    }

    // Get which days this subject has classes
    const scheduledDays = new Set(subject.schedules.map((s) => s.dayOfWeek));

    // Weak days: days with attendance rate below 70%
    const weakDays: { day: string; attendanceRate: number }[] = [];
    for (const dayNum of scheduledDays) {
      const ds = dayStats[dayNum];
      if (ds.total > 0) {
        const rate = Math.round((ds.present / ds.total) * 100);
        if (rate < 70) {
          weakDays.push({ day: DAY_NAMES[dayNum], attendanceRate: rate });
        }
      }
    }

    // Project forward
    const projectionPoints: { date: string; actualPct: number | null; projectedPct: number | null }[] = [];

    const semesterStart = currentSemester
      ? new Date(currentSemester.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    semesterStart.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Generate past dates (from start to today - 1)
    let runningTotal = 0;
    let runningPresent = 0;
    let recordIndex = 0;
    const records = subject.attendanceRecords;

    for (let d = new Date(semesterStart); d < today; d.setDate(d.getDate() + 1)) {
      while (recordIndex < records.length && new Date(records[recordIndex].date).getTime() <= d.getTime()) {
        const rec = records[recordIndex];
        runningTotal++;
        if (rec.status === "present" || rec.status === "late") {
          runningPresent++;
        }
        recordIndex++;
      }

      const dayDiff = Math.round((d.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff % 7 === 0) {
        projectionPoints.push({
          date: d.toISOString().slice(0, 10),
          actualPct: runningTotal === 0 ? null : Math.round((runningPresent / runningTotal) * 10000) / 100,
          projectedPct: null,
        });
      }
    }

    // 2. Add today's point (bridge point)
    projectionPoints.push({
      date: today.toISOString().slice(0, 10),
      actualPct: stats.currentPercentage,
      projectedPct: stats.currentPercentage,
    });

    // 3. Iterate through future dates
    let projectedPresent = subject.totalPresent + subject.totalLate;
    let projectedTotal = subject.totalClassesHeld;

    for (
      let d = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      d <= semesterEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const dayOfWeek = d.getDay();

      if (scheduledDays.has(dayOfWeek)) {
        // Count how many schedules on this day
        const classCount = subject.schedules.filter(
          (s) => s.dayOfWeek === dayOfWeek
        ).length;

        for (let c = 0; c < classCount; c++) {
          projectedTotal++;
          // Use historical day-of-week attendance rate as probability
          const ds = dayStats[dayOfWeek];
          const attendProb =
            ds.total > 0 ? ds.present / ds.total : 0.75; // default 75% if no data

          // Deterministic projection using probability
          projectedPresent += attendProb;
        }
      }

      // Sample projection point every 7 days
      const dayDiff = Math.round(
        (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayDiff % 7 === 0 || d.getTime() >= semesterEnd.getTime() - 86400000) {
        const pct =
          projectedTotal === 0
            ? 0
            : Math.round((projectedPresent / projectedTotal) * 10000) / 100;
        const dateStr = d.toISOString().slice(0, 10);
        if (projectionPoints[projectionPoints.length - 1]?.date !== dateStr) {
          projectionPoints.push({
            date: dateStr,
            actualPct: null,
            projectedPct: pct,
          });
        }
      }
    }

    const projectedEndPct =
      projectedTotal === 0
        ? 0
        : Math.round((projectedPresent / projectedTotal) * 10000) / 100;

    const willPass = projectedEndPct >= subject.minAttendancePct;

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      colorHex: subject.colorHex,
      currentPct: stats.currentPercentage,
      projectedEndPct,
      minRequiredPct: subject.minAttendancePct,
      willPass,
      projectionPoints,
      weakDays: weakDays.sort((a, b) => a.attendanceRate - b.attendanceRate),
    };
  });

  const passing = forecasts.filter((f) => f.willPass).length;

  return Response.json({
    forecasts,
    summary: {
      passing,
      total: forecasts.length,
      semesterEndDate: semesterEnd.toISOString().slice(0, 10),
    },
  });
}
