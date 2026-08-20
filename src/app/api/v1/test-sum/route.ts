import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const counts = await prisma.attendanceRecord.groupBy({
    by: ['status'],
    _sum: { weight: true }
  });
  return NextResponse.json({ counts, type: typeof counts[0]?._sum?.weight });
}
