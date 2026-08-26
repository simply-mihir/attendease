import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { recalcSubjectStats } from "@/lib/subject-stats";
import { notifyUserModification } from "@/lib/attendance-notifier";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { startDate, endDate, reason, subjectIds } = body as {
      startDate: string;
      endDate: string;
      reason: string;
      subjectIds?: string[];
    };

    if (!startDate || !endDate || !reason) {
      return Response.json(
        { error: "startDate, endDate, and reason are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return Response.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (end < start) {
      return Response.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Max 30 days
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 30) {
      return Response.json(
        { error: "Date range cannot exceed 30 days" },
        { status: 400 }
      );
    }

    // Get subjects
    const subjectWhere: Record<string, unknown> = {
      userId: user.id,
      isArchived: false,
    };
    if (subjectIds && subjectIds.length > 0) {
      subjectWhere.id = { in: subjectIds };
    }

    const subjects = await prisma.subject.findMany({
      where: subjectWhere,
      select: { id: true, name: true },
    });

    if (subjects.length === 0) {
      return Response.json({ error: "No subjects found" }, { status: 404 });
    }

    const subjectIdSet = new Set(subjects.map((s) => s.id));

    // Get all active schedules for these subjects
    const schedules = await prisma.schedule.findMany({
      where: {
        userId: user.id,
        subjectId: { in: Array.from(subjectIdSet) },
        isActive: true,
      },
    });

    // Build schedule lookup by dayOfWeek
    const schedulesByDay = new Map<number, typeof schedules>();
    for (const sched of schedules) {
      const list = schedulesByDay.get(sched.dayOfWeek) || [];
      list.push(sched);
      schedulesByDay.set(sched.dayOfWeek, list);
    }

    // Iterate over each date in the range
    const upsertPromises: Promise<unknown>[] = [];
    const affectedSubjectIds = new Set<string>();

    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const dayOfWeek = d.getDay();
      const matchingSchedules = schedulesByDay.get(dayOfWeek) || [];
      const dateObj = new Date(d.toISOString().slice(0, 10));

      for (const sched of matchingSchedules) {
        affectedSubjectIds.add(sched.subjectId);
        upsertPromises.push(
          prisma.attendanceRecord.upsert({
            where: {
              subjectId_userId_date_scheduleId: {
                subjectId: sched.subjectId,
                userId: user.id,
                date: dateObj,
                scheduleId: sched.id,
              },
            },
            create: {
              subjectId: sched.subjectId,
              userId: user.id,
              scheduleId: sched.id,
              date: dateObj,
              status: "excused",
              source: "medical_leave",
              notes: reason,
            },
            update: {
              status: "excused",
              source: "medical_leave",
              notes: reason,
              editedAt: new Date(),
              editedReason: "Medical leave bulk update",
            },
          })
        );
      }
    }

    await Promise.all(upsertPromises);

    // Recalculate stats for all affected subjects
    await Promise.all(
      Array.from(affectedSubjectIds).map((sid) => recalcSubjectStats(sid))
    );

    const affectedSubjectNames = subjects
      .filter((s) => affectedSubjectIds.has(s.id))
      .map((s) => s.name);

    notifyUserModification(user.id, "Medical Leave Approved", `Duration: ${start.toDateString()} to ${end.toDateString()}\nReason: ${reason}\nRecords updated: ${upsertPromises.length}`).catch(console.error);
    
    return Response.json({
      marked: upsertPromises.length,
      subjects: affectedSubjectNames,
    });
  } catch (error) {
    console.error("Medical leave error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
