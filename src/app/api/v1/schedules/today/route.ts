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

  const [schedules, extraClasses] = await Promise.all([
    prisma.schedule.findMany({
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
    }),
    prisma.scheduleOverride.findMany({
      where: {
        userId: user.id,
        date: todayDateForQuery,
        type: "extra",
        ...(semesterId ? { subject: { semesterId } } : {}),
      },
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
    }),
  ]);

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

  const regularClasses = schedules.map((s) => {
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
      isExtra: false,
    };
  });

  const extraClassList = extraClasses.map((s) => {
    // For extra classes, scheduleId in attendance record might be the override ID or null.
    // If it's a direct override link, use it. Otherwise, rely on subject match if we want, but better use the override ID.
    const key = `${s.subjectId}-${s.id}`;
    let record = markedMap.get(key);
    if (!record) {
      // Fallback: any unmarked record for this subject today that isn't mapped to a schedule
      const fallbackRecord = todayRecords.find(r => r.subjectId === s.subjectId && !r.scheduleId);
      if (fallbackRecord) record = fallbackRecord;
    }

    const pct = s.subject.currentPercentage;
    const min = s.subject.minAttendancePct;
    const buffer = pct - min;
    
    // Extract room from note if present "Extra Class (Room: ...)" or "Extra Class: Topic (Room: ...)"
    const roomMatch = s.note?.match(/\((.*?)\)/);
    const room = roomMatch ? roomMatch[1] : "";

    return {
      scheduleId: s.id, // Using override ID as scheduleId so attendance gets linked
      subjectId: s.subject.id,
      subjectName: s.subject.name,
      colorHex: s.subject.colorHex,
      startTime: s.originalTime || "00:00",
      endTime: s.newTime || "00:00",
      room: room,
      currentPct: pct,
      minPct: min,
      statusColor: buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red",
      streakCount: s.subject.streakCount,
      attendanceMarked: !!record,
      attendanceStatus: record?.status || null,
      isExtra: true,
      weight: s.weight,
    };
  });

  const classes = [...regularClasses, ...extraClassList].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return Response.json({ date: todayStr, dayName: dayNames[dayOfWeek], classes });
}
