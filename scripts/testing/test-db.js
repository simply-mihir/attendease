require('dotenv').config();
const { prisma } = require('../../src/lib/db');
async function test() {
  const sums = await prisma.attendanceRecord.groupBy({ by: ['status'], _sum: { weight: true } });
  console.log('Sums:', sums);
}
test().catch(console.error).finally(() => process.exit(0));
