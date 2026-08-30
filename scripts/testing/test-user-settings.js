const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.notificationSetting.findUnique({
    where: { userId: "cms0mf2w80000l104jfjlzk9a" }
  });
  console.log("Settings:", settings);
}
main().catch(console.error).finally(() => prisma.$disconnect());
