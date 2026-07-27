import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance, simulateSkip } from "@/lib/attendance-calc";

interface SkipRecommendation {
  subjectId: string;
  subjectName: string;
  colorHex: string;
  currentPct: number;
  skipsAllocated: number;
  newPct: number;
  newStatus: "green" | "yellow" | "red";
  remainingBuffer: number;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const maxSkips = parseInt(
    req.nextUrl.searchParams.get("maxSkips") || "5",
    10
  );

  if (maxSkips < 1 || maxSkips > 15) {
    return Response.json(
      { error: "maxSkips must be between 1 and 15" },
      { status: 400 }
    );
  }

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, isArchived: false },
    orderBy: { name: "asc" },
  });

  // Calculate stats for each subject
  const subjectData = subjects.map((s) => {
    const stats = {
      totalClasses: s.totalClassesHeld,
      totalPresent: s.totalPresent,
      totalLate: s.totalLate,
      totalAbsent: s.totalAbsent,
      totalExcused: s.totalExcused,
      minRequiredPct: s.minAttendancePct,
    };
    const result = calculateAttendance(stats);
    return {
      subjectId: s.id,
      subjectName: s.name,
      colorHex: s.colorHex,
      currentPct: result.currentPercentage,
      stats,
      canSkip: result.canSkipCount,
      skipsAllocated: 0,
    };
  });

  // Greedy allocation: assign skips to the subject with the highest remaining buffer
  let skipsRemaining = maxSkips;

  while (skipsRemaining > 0) {
    // Find subject with highest remaining skip capacity
    let bestIdx = -1;
    let bestCanSkip = 0;

    for (let i = 0; i < subjectData.length; i++) {
      const remainingCanSkip =
        subjectData[i].canSkip - subjectData[i].skipsAllocated;
      if (remainingCanSkip > bestCanSkip) {
        bestCanSkip = remainingCanSkip;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break; // No subject can absorb more skips

    subjectData[bestIdx].skipsAllocated++;
    skipsRemaining--;
  }

  const totalSkipsUsed = maxSkips - skipsRemaining;

  // Build recommendations
  const recommendations: SkipRecommendation[] = subjectData
    .filter((sd) => sd.skipsAllocated > 0)
    .map((sd) => {
      const sim = simulateSkip(sd.stats, sd.skipsAllocated);
      return {
        subjectId: sd.subjectId,
        subjectName: sd.subjectName,
        colorHex: sd.colorHex,
        currentPct: sd.currentPct,
        skipsAllocated: sd.skipsAllocated,
        newPct: sim.newPercentage,
        newStatus: sim.newStatus,
        remainingBuffer: sd.canSkip - sd.skipsAllocated,
      };
    })
    .sort((a, b) => b.skipsAllocated - a.skipsAllocated);

  return Response.json({
    recommendations,
    totalSkipsUsed,
    totalRequested: maxSkips,
    safeToSkipAll: totalSkipsUsed === maxSkips,
  });
}
