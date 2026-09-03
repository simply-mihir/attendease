import { prisma } from "@/lib/db";

export async function calcOverallStreak(userId: string): Promise<number> {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Only look back 365 days max — no need to fetch ancient records
  const lookbackDate = new Date(startOfToday);
  lookbackDate.setDate(lookbackDate.getDate() - 365);

  // 1. Fetch attendance records, exceptions, and exams within lookback window
  const [allRecords, exceptions, exams] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { userId, date: { gte: lookbackDate } },
      select: { date: true, status: true },
      orderBy: { date: "desc" },
    }),
    prisma.classException.findMany({
      where: { userId, date: { gte: lookbackDate } },
      select: { date: true },
    }),
    prisma.reminder.findMany({
      where: { userId, category: "exam", dueDate: { gte: lookbackDate }, isCompleted: false },
      select: { dueDate: true },
    }),
  ]);

  const exceptionDates = new Set(exceptions.map((e) => e.date.toISOString().slice(0, 10)));
  const examDates = new Set(exams.map((e) => e.dueDate.toISOString().slice(0, 10)));

  // Group records by YYYY-MM-DD
  const recordsByDate = new Map<string, { hasAbsent: boolean; hasPresent: boolean; allCancelledOrHoliday: boolean }>();
  for (const r of allRecords) {
    const dStr = r.date.toISOString().slice(0, 10);
    const curr = recordsByDate.get(dStr) || { hasAbsent: false, hasPresent: false, allCancelledOrHoliday: true };

    if (r.status === "absent") {
      curr.hasAbsent = true;
      curr.allCancelledOrHoliday = false;
    } else if (r.status === "present" || r.status === "late" || r.status === "excused") {
      curr.hasPresent = true;
      curr.allCancelledOrHoliday = false;
    } else if (r.status !== "cancelled" && r.status !== "holiday") {
      curr.allCancelledOrHoliday = false;
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

    // If there is an exam on this day, it's an automatic streak increment!
    if (examDates.has(dStr)) {
      overallStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    // Saturdays (6) and Sundays (0) are non-working day exceptions
    if (dow === 0 || dow === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    // College / class exception date (holiday / cancelled)
    if (exceptionDates.has(dStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const dayData = recordsByDate.get(dStr);

    if (dayData) {
      if (dayData.hasAbsent) {
        break; // Absence breaks overall streak!
      } else if (dayData.hasPresent) {
        overallStreak++;
      } else if (dayData.allCancelledOrHoliday) {
        // Class was cancelled / holiday -> DO NOT break streak! Continue to previous days.
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
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
