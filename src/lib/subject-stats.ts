import { prisma } from "@/lib/db";

export async function recalcSubjectStats(subjectId: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: { subjectId },
  });

  const countable = records.filter((r) => r.status !== "holiday" && r.status !== "cancelled");
  const totalClassesHeld = countable.length;
  const totalPresent = countable.filter((r) => r.status === "present").length;
  const totalAbsent = countable.filter((r) => r.status === "absent").length;
  const totalLate = countable.filter((r) => r.status === "late").length;
  const totalExcused = countable.filter((r) => r.status === "excused").length;
  
  const totalCancelled = records.filter((r) => r.status === "cancelled").length;

  const effective = totalPresent + totalLate;
  const currentPercentage =
    totalClassesHeld === 0 ? 0 : Math.round((effective / totalClassesHeld) * 10000) / 100;

  // Calculate streak
  const sorted = records
    .filter((r) => !["holiday", "cancelled"].includes(r.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streakCount = 0;
  for (const rec of sorted) {
    if (rec.status === "present" || rec.status === "late") {
      streakCount++;
    } else break;
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  const longestStreak = Math.max(streakCount, subject?.longestStreak ?? 0);

  await prisma.subject.update({
    where: { id: subjectId },
    data: {
      totalClassesHeld,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      totalCancelled,
      currentPercentage,
      streakCount,
      longestStreak,
    },
  });

  return { totalClassesHeld, totalPresent, totalAbsent, totalLate, totalExcused, totalCancelled, currentPercentage, streakCount };
}
