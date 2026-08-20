import { prisma } from "@/lib/db";

export async function recalcSubjectStats(subjectId: string) {
  // Aggregate sum of weights directly in DB
  const counts = await prisma.attendanceRecord.groupBy({
    by: ["status"],
    where: { subjectId },
    _sum: {
      weight: true
    },
  });

  const present = counts.find((c) => c.status === "present")?._sum.weight ?? 0;
  const late = counts.find((c) => c.status === "late")?._sum.weight ?? 0;
  const absent = counts.find((c) => c.status === "absent")?._sum.weight ?? 0;
  const excused = counts.find((c) => c.status === "excused")?._sum.weight ?? 0;
  const cancelled = counts.find((c) => c.status === "cancelled")?._sum.weight ?? 0;
  
  const totalClassesHeld = present + late + absent + excused;
  const effective = present + late;
  const currentPercentage =
    totalClassesHeld === 0 ? 100 : Math.round((effective / totalClassesHeld) * 10000) / 100;

  // Calculate streak — only need the most recent consecutive run
  // Limit to 200 records; any real streak won't exceed this
  const recentRecords = await prisma.attendanceRecord.findMany({
    where: {
      subjectId,
      status: { notIn: ["holiday", "cancelled"] }
    },
    select: { status: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  let streakCount = 0;
  for (const rec of recentRecords) {
    if (rec.status === "present" || rec.status === "late") {
      streakCount++;
    } else break;
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  const longestStreak = Math.max(streakCount, subject?.longestStreak ?? 0);

  // Single update
  await prisma.subject.update({
    where: { id: subjectId },
    data: {
      totalClassesHeld,
      totalPresent: present,
      totalAbsent: absent,
      totalLate: late,
      totalExcused: excused,
      totalCancelled: cancelled,
      currentPercentage,
      streakCount,
      longestStreak,
    },
  });

  return { totalClassesHeld, totalPresent: present, totalAbsent: absent, totalLate: late, totalExcused: excused, totalCancelled: cancelled, currentPercentage, streakCount };
}
