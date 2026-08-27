const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst();
  if (!user) return;
  const holidays = await prisma.holiday.findMany({
    include: { semester: true }
  });
  console.log("Holidays:", holidays);
  process.exit(0);
}
check();
