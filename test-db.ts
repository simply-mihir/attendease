import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/lib/db';
async function test() {
  const records = await prisma.attendanceRecord.findMany({ take: 5 });
  console.log('Attendance Records:', records);
  const sums = await prisma.attendanceRecord.groupBy({ by: ['status'], _sum: { weight: true } });
  console.log('Sums:', sums);
}
test().catch(console.error).finally(() => process.exit(0));
