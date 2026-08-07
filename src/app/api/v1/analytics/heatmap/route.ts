import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { cachedJson } from "@/lib/api-cache";

export const dynamic = "force-dynamic";

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
  const byDate = new Map<string, { present: number; absent: number; late: number; excused: number; cancelled: number; total: number }>();
  for (const r of records) {
    const dateStr = new Date(r.date).toISOString().slice(0, 10);
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, { present: 0, absent: 0, late: 0, excused: 0, cancelled: 0, total: 0 });
    }
    const entry = byDate.get(dateStr)!;
    entry.total++;
    if (r.status === "present") entry.present++;
    else if (r.status === "absent") entry.absent++;
    else if (r.status === "late") entry.late++;
    else if (r.status === "excused") entry.excused++;
    else if (r.status === "cancelled" || r.status === "holiday") entry.cancelled++;
  }

  const data = Array.from(byDate.entries()).map(([date, stats]) => {
    let intensity = 0;
    if (stats.total === 0) {
      intensity = 0;
    } else if (stats.cancelled === stats.total) {
      intensity = 5; // Full day cancelled
    } else if (stats.cancelled > 0) {
      intensity = 6; // Partial cancelled
    } else if (stats.present + stats.late === stats.total) {
      intensity = 4;
    } else if (stats.present + stats.late > stats.absent) {
      intensity = 3;
    } else if (stats.present + stats.late > 0) {
      intensity = 2;
    } else {
      intensity = 1;
    }

    return {
      date,
      count: stats.total,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      cancelled: stats.cancelled,
      intensity,
    };
  });

  return cachedJson({ year, data }, 120);
}
