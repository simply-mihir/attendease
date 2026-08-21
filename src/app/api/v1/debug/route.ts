import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const [semesters, subjects, recordCount] = await Promise.all([
    prisma.semester.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, isCurrent: true },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        semesterId: true,
        isArchived: true,
        totalClassesHeld: true,
        totalPresent: true,
        totalLate: true,
        totalAbsent: true,
        currentPercentage: true,
      },
    }),
    prisma.attendanceRecord.count({ where: { userId: user.id } }),
  ]);

  const activeSem = semesters.find((s) => s.isCurrent);

  return Response.json({
    userId: user.id,
    semesters,
    activeSemesterId: activeSem?.id || null,
    activeSemesterName: activeSem?.name || null,
    subjects: subjects.map((s) => ({
      ...s,
      matchesActiveSem: s.semesterId === activeSem?.id,
    })),
    totalAttendanceRecords: recordCount,
  });
}
