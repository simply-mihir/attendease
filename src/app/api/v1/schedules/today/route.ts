import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const todayStr = now.toISOString().slice(0, 10);

  const schedules = await prisma.schedule.findMany({
    where: { userId: user.id, dayOfWeek, isActive: true },
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

  // Check which ones have attendance marked today
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: {
      userId: user.id,
      date: new Date(todayStr),
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
