import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance } from "@/lib/attendance-calc";

interface GoalClassPlan {
  subjectName: string;
  colorHex: string;
  startTime: string;
  endTime: string;
  room: string | null;
  currentPct: number;
  projectedGoalPct: number;
  priority: "mandatory" | "recommended" | "optional";
  canSkipForGoal: number;
  scheduleId: string;
  subjectId: string;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  // Get user's goal settings
  const settings = await prisma.notificationSetting.findUnique({
    where: { userId: user.id },
  });

  const goalEnabled = settings?.goalModeEnabled ?? false;
  const goalPct = settings?.goalTargetPct ?? 85.0;

  if (!goalEnabled) {
    return Response.json({
      goalPct,
      goalEnabled: false,
      todaysPlan: [],
      summary: { mustAttend: 0, canSkip: 0 },
    });
  }

  // Get today's schedules
  const now = new Date();
  const dayOfWeek = now.getDay();

  const schedules = await prisma.schedule.findMany({
    where: {
      userId: user.id,
      dayOfWeek,
      isActive: true,
      subject: { isArchived: false },
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          colorHex: true,
          totalClassesHeld: true,
          totalPresent: true,
          totalLate: true,
          totalAbsent: true,
          totalExcused: true,
          minAttendancePct: true,
          currentPercentage: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const todaysPlan: GoalClassPlan[] = [];

  for (const sched of schedules) {
    const s = sched.subject;
    const stats = calculateAttendance({
      totalClasses: s.totalClassesHeld,
      totalPresent: s.totalPresent,
      totalLate: s.totalLate,
      totalAbsent: s.totalAbsent,
      totalExcused: s.totalExcused,
      minRequiredPct: goalPct, // Use GOAL pct, not min required
    });

    const effectivePresent = s.totalPresent + s.totalLate;
    const goalReq = goalPct / 100;

    // Calculate how many classes can be skipped while staying at/above goal
    const canSkipForGoal =
      effectivePresent - goalReq * s.totalClassesHeld > 0
        ? Math.floor(
            (effectivePresent - goalReq * s.totalClassesHeld) / goalReq
          )
        : 0;

    let priority: "mandatory" | "recommended" | "optional";
    if (canSkipForGoal <= 0) {
      priority = "mandatory";
    } else if (canSkipForGoal <= 2) {
      priority = "recommended";
    } else {
      priority = "optional";
    }

    todaysPlan.push({
      subjectName: s.name,
      colorHex: s.colorHex,
      startTime: sched.startTime,
      endTime: sched.endTime,
      room: sched.room,
      currentPct: s.currentPercentage,
      projectedGoalPct: goalPct,
      priority,
      canSkipForGoal: Math.max(0, canSkipForGoal),
      scheduleId: sched.id,
      subjectId: s.id,
    });
  }

  const mustAttend = todaysPlan.filter((c) => c.priority === "mandatory").length;
  const canSkip = todaysPlan.filter((c) => c.priority === "optional").length;

  return Response.json({
    goalPct,
    goalEnabled: true,
    todaysPlan,
    summary: { mustAttend, canSkip, total: todaysPlan.length },
  });
}
