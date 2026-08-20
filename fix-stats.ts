import 'dotenv/config';
import { prisma } from './src/lib/db';

async function fix() {
  const subjects = await prisma.subject.findMany();
  for (const subject of subjects) {
    const counts = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { subjectId: subject.id },
      _sum: { weight: true },
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

    const recentRecords = await prisma.attendanceRecord.findMany({
      where: {
        subjectId: subject.id,
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

    const longestStreak = Math.max(streakCount, subject.longestStreak || 0);

    await prisma.subject.update({
      where: { id: subject.id },
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
    console.log(`Fixed subject ${subject.name} - totalClassesHeld: ${totalClassesHeld}`);
  }
}

fix().then(() => {
  console.log('All subjects fixed!');
  process.exit(0);
}).catch(console.error);
