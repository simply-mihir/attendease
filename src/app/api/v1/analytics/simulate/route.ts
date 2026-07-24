import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { simulateSkip, simulateAttend, calculateAttendance } from "@/lib/attendance-calc";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const { subjectId, scenario, count } = body;

  if (!subjectId || !scenario || !count) {
    return Response.json({ error: "Missing subjectId, scenario, or count" }, { status: 400 });
  }

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: user.id },
  });
  if (!subject) return Response.json({ error: "Subject not found" }, { status: 404 });

  const stats = {
    totalClasses: subject.totalClassesHeld,
    totalPresent: subject.totalPresent,
    totalLate: subject.totalLate,
    totalAbsent: subject.totalAbsent,
    totalExcused: subject.totalExcused,
    minRequiredPct: subject.minAttendancePct,
  };

  const current = calculateAttendance(stats);
  const result =
    scenario === "skip"
      ? simulateSkip(stats, count)
      : simulateAttend(stats, count);

  // Recalc can-skip and must-attend for new scenario
  const newEffective =
    scenario === "skip"
      ? stats.totalPresent + stats.totalLate
      : stats.totalPresent + stats.totalLate + count;
  const newTotal = stats.totalClasses + count;
  const newPct = newTotal === 0 ? 0 : (newEffective / newTotal) * 100;
  const buffer = newPct - stats.minRequiredPct;
  const newCanSkip =
    buffer >= 0
      ? Math.floor(
          (newEffective - (stats.minRequiredPct / 100) * newTotal) /
            (stats.minRequiredPct / 100)
        )
      : 0;
  const newMustAttend =
    buffer < 0
      ? Math.ceil(
          ((stats.minRequiredPct / 100) * newTotal - newEffective) /
            (1 - stats.minRequiredPct / 100)
        )
      : 0;

  return Response.json({
    currentPct: current.currentPercentage,
    currentStatus: current.statusColor,
    simulatedPct: result.newPercentage,
    newStatus: result.newStatus,
    safe: result.safe,
    newCanSkip: Math.max(0, newCanSkip),
    newMustAttend: Math.max(0, newMustAttend),
  });
}
