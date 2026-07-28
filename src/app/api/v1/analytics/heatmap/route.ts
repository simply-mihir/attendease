import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { cachedJson } from "@/lib/api-cache";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());

  const records = await prisma.attendanceRecord.findMany({
    where: {
      userId: user.id,
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  });

  // Group by date
  const byDate = new Map<string, { present: number; absent: number; late: number; excused: number; total: number }>();
  for (const r of records) {
    const dateStr = new Date(r.date).toISOString().slice(0, 10);
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    }
    const entry = byDate.get(dateStr)!;
    entry.total++;
    if (r.status === "present") entry.present++;
    else if (r.status === "absent") entry.absent++;
    else if (r.status === "late") entry.late++;
    else if (r.status === "excused") entry.excused++;
  }

  const data = Array.from(byDate.entries()).map(([date, stats]) => ({
    date,
    count: stats.total,
    present: stats.present,
    absent: stats.absent,
    late: stats.late,
    // Intensity: 0 = no class, 1 = all absent, 2 = mixed, 3 = mostly present, 4 = all present
    intensity:
      stats.total === 0
        ? 0
        : stats.present + stats.late === stats.total
        ? 4
        : stats.present + stats.late > stats.absent
        ? 3
        : stats.present + stats.late > 0
        ? 2
        : 1,
  }));

  return cachedJson({ year, data }, 120);
}
