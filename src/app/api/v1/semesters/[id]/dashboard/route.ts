import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      subjects: {
        include: {
          attendanceRecords: true,
          schedules: true,
        },
      },
      holidays: { orderBy: { date: "asc" } },
      examPeriods: { orderBy: { startDate: "asc" } },
    },
  });

  if (!semester) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 });
  }

  // Calculate stats per subject
  const subjectsWithStats = semester.subjects.map(subject => {
    // For past semesters, the total classes is what they had
    const total = subject.totalClassesHeld > 0 ? subject.totalClassesHeld : subject.attendanceRecords.length;
    const attended = subject.totalPresent + subject.totalLate;
    return {
      ...subject,
      totalClasses: total,
      attendedClasses: attended,
      percentage: total > 0 ? Math.round((attended / total) * 1000) / 10 : 0,
    };
  });

  // Overall stats
  const totalClasses = subjectsWithStats.reduce((sum, s) => sum + s.totalClasses, 0);
  const totalAttended = subjectsWithStats.reduce((sum, s) => sum + s.attendedClasses, 0);

  return NextResponse.json({
    semester: {
      id: semester.id,
      name: semester.name,
      startDate: semester.startDate,
      endDate: semester.endDate,
      isCurrent: semester.isCurrent,
    },
    subjects: subjectsWithStats,
    overall: {
      totalClasses,
      totalAttended,
      percentage: totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 1000) / 10 : 0,
    },
    holidays: semester.holidays,
    examPeriods: semester.examPeriods,
  });
}
