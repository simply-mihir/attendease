import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET — list subjects available for import
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

  // Get IDs of subjects already in this semester
  const currentSubjectIds = await prisma.subject.findMany({
    where: { semesterId: params.id },
    select: { id: true },
  });
  const currentIds = new Set(currentSubjectIds.map(s => s.id));

  // 1. Orphan subjects (no semester assigned)
  const orphanSubjects = await prisma.subject.findMany({
    where: { userId: user.id, semesterId: null },
    include: {
      _count: { select: { attendanceRecords: true } },
    },
  });

  // 2. Subjects from other semesters
  const otherSemesterSubjects = await prisma.subject.findMany({
    where: {
      userId: user.id,
      AND: [{ semesterId: { not: null } }, { semesterId: { not: params.id } }],
    },
    include: {
      semester: { select: { id: true, name: true } },
      _count: { select: { attendanceRecords: true } },
    },
  });

  return NextResponse.json({
    orphans: orphanSubjects,
    fromOtherSemesters: otherSemesterSubjects.filter(s => !currentIds.has(s.id)),
  });
}

// POST — import selected subjects into this semester
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id, isCurrent: true },
  });
  if (!semester) {
    return NextResponse.json({ error: "Can only import into active semester" }, { status: 400 });
  }

  const { subjects } = await req.json();

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: "No subjects selected" }, { status: 400 });
  }

  const imported = [];

  for (const item of subjects) {
    const { id: subjectId, mode } = item;

    // Verify the subject belongs to this user
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.id },
    });
    if (!subject) continue;

    if (mode === "move") {
      // Move: just reassign semesterId
      const updated = await prisma.subject.update({
        where: { id: subjectId },
        data: { semesterId: params.id },
      });
      imported.push({ ...updated, importMode: "moved" });

    } else if (mode === "copy") {
      // Copy: create a new subject with same details, fresh attendance
      const {
        id, createdAt, updatedAt, semesterId,
        totalClassesHeld, totalPresent, totalAbsent, totalLate, totalExcused, totalCancelled,
        currentPercentage, streakCount, longestStreak,
        ...copyData
      } = subject as any;
      
      const newSubject = await prisma.subject.create({
        data: {
          ...copyData,
          userId: user.id,
          semesterId: params.id,
          totalClassesHeld: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          totalExcused: 0,
          totalCancelled: 0,
          currentPercentage: 0,
          streakCount: 0,
          longestStreak: 0,
        },
      });
      imported.push({ ...newSubject, importMode: "copied" });

      // Also copy schedules if they exist
      const schedules = await prisma.schedule.findMany({
        where: { subjectId },
      });
      if (schedules.length > 0) {
        for (const sched of schedules) {
          const { id: schedId, createdAt: sc, updatedAt: su, subjectId: oldSid, ...schedData } = sched as any;
          await prisma.schedule.create({
            data: {
              ...schedData,
              subjectId: newSubject.id,
              userId: user.id,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ imported, count: imported.length }, { status: 201 });
}
