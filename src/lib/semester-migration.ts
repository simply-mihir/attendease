import { prisma } from "@/lib/db";

export async function migrateExistingSubjects(userId: string) {
  const existingSemesters = await prisma.semester.count({ where: { userId } });
  if (existingSemesters > 0) return; // already migrated

  const subjectsWithoutSemester = await prisma.subject.findMany({
    where: { userId, semesterId: null },
  });
  if (subjectsWithoutSemester.length === 0) return;

  // Create a default semester
  const semester = await prisma.semester.create({
    data: {
      userId,
      name: "Current Semester",
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(new Date().getFullYear(), 11, 31),
      isCurrent: true,
    },
  });

  // Assign all orphan subjects to this semester
  await prisma.subject.updateMany({
    where: { userId, semesterId: null },
    data: { semesterId: semester.id },
  });
}
