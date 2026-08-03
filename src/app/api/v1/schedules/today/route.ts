import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { getUserTimezone, getUserToday } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const searchParams = req.nextUrl.searchParams;
  const semesterId = searchParams.get("semesterId");

  const tz = await getUserTimezone(user.id);
  const { dayOfWeek, dateStr: todayStr } = getUserToday(tz);
  // AttendanceRecord.date is @db.Date (no time component), so use exact date match
  const todayDateForQuery = new Date(todayStr);

  const whereClause: any = { userId: user.id, dayOfWeek, isActive: true };
  if (semesterId) {
    whereClause.subject = { semesterId };
  }

  const schedules = await prisma.schedule.findMany({
    where: whereClause,
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          colorHex: true,
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
  });

  // Check which ones have attendance marked today (exact date match for @db.Date)
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: {
      userId: user.id,
      date: todayDateForQuery,
    },
  });

  const markedMap = new Map(
    todayRecords.map((r) => [`${r.subjectId}-${r.scheduleId || ""}`, r])
  );

  const classes = schedules.map((s) => {
    const key = `${s.subjectId}-${s.id}`;
    const record = markedMap.get(key);
    const pct = s.subject.currentPercentage;
    const min = s.subject.minAttendancePct;
    const buffer = pct - min;
    return {
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
    };
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return Response.json({ date: todayStr, dayName: dayNames[dayOfWeek], classes });
}
