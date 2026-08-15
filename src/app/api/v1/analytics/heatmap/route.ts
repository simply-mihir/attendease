import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { cachedJson } from "@/lib/api-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  // Only fetch current year by default; accept ?year= param
  const searchParams = req.nextUrl.searchParams;
  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      userId: user.id,
      date: { gte: yearStart, lt: yearEnd },
    },
    select: { date: true, status: true, subject: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  // Group by date
  type DayStats = {
    total: number;
    present: string[];
    absent: string[];
    late: string[];
    excused: string[];
    cancelled: string[];
  };
  
  const byDate = new Map<string, DayStats>();
  for (const r of records) {
    const dateStr = new Date(r.date).toISOString().slice(0, 10);
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, { present: [], absent: [], late: [], excused: [], cancelled: [], total: 0 });
    }
    const entry = byDate.get(dateStr)!;
    entry.total++;
    
    const subjectName = r.subject?.name || "Unknown";
    if (r.status === "present") entry.present.push(subjectName);
    else if (r.status === "absent") entry.absent.push(subjectName);
    else if (r.status === "late") entry.late.push(subjectName);
    else if (r.status === "excused") entry.excused.push(subjectName);
    else if (r.status === "cancelled" || r.status === "holiday") entry.cancelled.push(subjectName);
  }

  const data = Array.from(byDate.entries()).map(([date, stats]) => {
    let intensity = 0;
    if (stats.total === 0) {
      intensity = 0;
    } else if (stats.cancelled.length === stats.total) {
      intensity = 5; // Full day cancelled
    } else if (stats.cancelled.length > 0) {
      intensity = 6; // Partial cancelled
    } else if (stats.present.length + stats.late.length === stats.total) {
      intensity = 4;
    } else if (stats.present.length + stats.late.length > stats.absent.length) {
      intensity = 3;
    } else if (stats.present.length + stats.late.length > 0) {
      intensity = 2;
    } else {
      intensity = 1;
    }

    return {
      date,
      count: stats.total,
      present: stats.present.length,
      absent: stats.absent.length,
      late: stats.late.length,
      cancelled: stats.cancelled.length,
      excused: stats.excused.length,
      presentSubjects: stats.present,
      absentSubjects: stats.absent,
      lateSubjects: stats.late,
      cancelledSubjects: stats.cancelled,
      excusedSubjects: stats.excused,
      intensity,
    };
  });

  return cachedJson({ data }, 120);
}
