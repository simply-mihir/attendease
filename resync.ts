import { PrismaClient } from "@prisma/client";
import { recalcSubjectStats } from "./src/lib/subject-stats";

const prisma = new PrismaClient();

async function run() {
  console.log("Fetching all subjects...");
  const subjects = await prisma.subject.findMany();
  console.log(`Found ${subjects.length} subjects.`);

  for (const s of subjects) {
    console.log(`Recalculating stats for subject: ${s.name} (${s.id})`);
    try {
      const stats = await recalcSubjectStats(s.id);
      console.log(`  -> Conducted: ${stats.totalClassesHeld}, Present: ${stats.totalPresent}, Cancelled: ${stats.totalCancelled}`);
    } catch (err) {
      console.error(`  -> Failed:`, err);
    }
  }

  console.log("Done resyncing!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
