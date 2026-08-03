import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { getUserTimezone, getUserToday } from "@/lib/timezone";

// Verify the quick-mark token (timezone-aware)
function verifyQuickMarkToken(
  userId: string,
  scheduleId: string,
  token: string,
  dateStr: string
): boolean {
  const secret = process.env.NEXTAUTH_SECRET || "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${scheduleId}:${dateStr}`)
    .digest("hex")
    .substring(0, 32);
  return token === expected;
}

export async function POST(req: NextRequest) {
  try {
    const { scheduleId, status, userId, token } = await req.json();

    if (!scheduleId || !status || !userId || !token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["PRESENT", "ABSENT", "LATE", "EXCUSED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get user's timezone for correct date handling
    const tz = await getUserTimezone(userId);
    const { dateStr } = getUserToday(tz);
    // AttendanceRecord.date is @db.Date — use midnight UTC of local date
    const todayDateForQuery = new Date(dateStr);

    // Verify token (prevents unauthorized marking)
    if (!verifyQuickMarkToken(userId, scheduleId, token, dateStr)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // Verify schedule belongs to user
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        subject: { userId },
      },
      include: { subject: true },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Check if already marked today (exact date match for @db.Date)
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        subjectId: schedule.subjectId,
        userId: userId,
        date: todayDateForQuery,
      },
    });

    if (existing) {
      await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { status },
      });
    } else {
      await prisma.attendanceRecord.create({
        data: {
          subjectId: schedule.subjectId,
          userId: userId,
          date: todayDateForQuery,
          status,
        },
      });
    }

    // Recalculate subject stats
    const counts = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { subjectId: schedule.subjectId, userId: userId },
      _count: true,
    });

    const present = counts.find((c) => c.status === "PRESENT")?._count ?? 0;
    const late = counts.find((c) => c.status === "LATE")?._count ?? 0;
    const absent = counts.find((c) => c.status === "ABSENT")?._count ?? 0;
    const total = present + late + absent;
    const attended = present + late;
    const currentPercentage = total === 0 ? 0 : Math.round((attended / total) * 100);

    await prisma.subject.update({
      where: { id: schedule.subjectId },
      data: { 
        totalClassesHeld: total, 
        totalPresent: present,
        totalLate: late,
        currentPercentage,
      },
    });

    return NextResponse.json({
      success: true,
      subjectName: schedule.subject.name,
      status,
    });
  } catch (error) {
    console.error("[Quick-Mark] Error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}
