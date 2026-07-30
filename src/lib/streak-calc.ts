import { prisma } from "@/lib/db";

export async function calcOverallStreak(userId: string): Promise<number> {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Fetch all attendance records for user except cancelled/holiday
  const allRecords = await prisma.attendanceRecord.findMany({
    where: {
      userId,
      status: { notIn: ["cancelled", "holiday"] },
    },
    select: { date: true, status: true },
    orderBy: { date: "desc" },
  });

  if (allRecords.length === 0) return 0;

  // Group records by YYYY-MM-DD
  const recordsByDate = new Map<string, { hasAbsent: boolean; hasPresent: boolean }>();
  for (const r of allRecords) {
    const dStr = r.date.toISOString().slice(0, 10);
    const curr = recordsByDate.get(dStr) || { hasAbsent: false, hasPresent: false };
    if (r.status === "absent") {
      curr.hasAbsent = true;
    } else if (r.status === "present" || r.status === "late" || r.status === "excused") {
      curr.hasPresent = true;
    }
    recordsByDate.set(dStr, curr);
  }

  // Fetch active schedules to know which days of week have classes
  const userSchedules = await prisma.schedule.findMany({
    where: { userId, isActive: true },
    select: { dayOfWeek: true },
  });
  const scheduledDaysOfWeek = new Set(userSchedules.map((s) => s.dayOfWeek));

  let overallStreak = 0;
  const checkDate = new Date(startOfToday);

  // Check backwards up to 365 days
  for (let i = 0; i < 365; i++) {
    const dow = checkDate.getDay();
    const dStr = checkDate.toISOString().slice(0, 10);

    // Saturdays (6) and Sundays (0) are non-working day exceptions
    if (dow === 0 || dow === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const dayData = recordsByDate.get(dStr);

    if (dayData) {
      if (dayData.hasAbsent) {
        break; // Absence breaks overall streak!
      } else if (dayData.hasPresent) {
        overallStreak++;
      }
    } else {
      // No attendance record for this working day
      if (i > 0 && scheduledDaysOfWeek.has(dow)) {
        // A past working day with scheduled classes was missed
        break;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return overallStreak;
}
