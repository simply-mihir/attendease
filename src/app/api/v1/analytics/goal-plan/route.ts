import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance } from "@/lib/attendance-calc";
import { getUserTimezone, getUserToday } from "@/lib/timezone";

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
  isOverride?: boolean;
  overrideType?: string | null;
}

/** Parse "HH:MM" to total minutes */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Convert total minutes to "HH:MM" */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

  // Use timezone-aware day
  const tz = await getUserTimezone(user.id);
  const { dayOfWeek, dateStr } = getUserToday(tz);

  // Fetch regular schedules and today's overrides in parallel
  const [schedules, overrides] = await Promise.all([
    prisma.schedule.findMany({
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
    }),
    prisma.scheduleOverride.findMany({
      where: {
        userId: user.id,
        date: new Date(dateStr + "T00:00:00Z"),
      },
      include: {
        subject: {
          select: {
            id: true, name: true, colorHex: true,
            totalClassesHeld: true, totalPresent: true, totalLate: true,
            totalAbsent: true, totalExcused: true, minAttendancePct: true,
            currentPercentage: true,
          },
        },
      },
    }),
  ]);

  // Build original time lookup for swap endTime resolution
  const originalBySubject = new Map<string, { startTime: string; endTime: string }>();
  for (const s of schedules) {
    originalBySubject.set(s.subject.id, { startTime: s.startTime, endTime: s.endTime });
  }

  // Build mutable schedule list, then apply overrides
  interface ScheduleEntry {
    scheduleId: string;
    subjectId: string;
    startTime: string;
    endTime: string;
    room: string | null;
    subject: typeof schedules[0]["subject"];
    isOverride: boolean;
    overrideType: string | null;
  }

  let entries: ScheduleEntry[] = schedules.map((sched) => ({
    scheduleId: sched.id,
    subjectId: sched.subject.id,
    startTime: sched.startTime,
    endTime: sched.endTime,
    room: sched.room,
    subject: sched.subject,
    isOverride: false,
    overrideType: null,
  }));

  // Apply overrides
  for (const ov of overrides) {
    switch (ov.type) {
      case "cancel":
        entries = entries.filter((e) => e.subjectId !== ov.subjectId);
        break;

      case "reschedule": {
        const idx = entries.findIndex((e) => e.subjectId === ov.subjectId);
        if (idx !== -1 && ov.newTime) {
          const orig = entries[idx];
          const duration = timeToMinutes(orig.endTime) - timeToMinutes(orig.startTime);
          const newEnd = duration > 0 ? minutesToTime(timeToMinutes(ov.newTime) + duration) : orig.endTime;
          entries[idx] = { ...orig, startTime: ov.newTime, endTime: newEnd, isOverride: true, overrideType: "rescheduled" };
        } else if (idx === -1 && ov.subject && ov.newTime) {
          entries.push({
            scheduleId: ov.id,
            subjectId: ov.subjectId,
            startTime: ov.newTime,
            endTime: "",
            room: null,
            subject: ov.subject,
            isOverride: true,
            overrideType: "rescheduled",
          });
        }
        break;
      }

      case "extra":
        if (ov.subject) {
          entries.push({
            scheduleId: ov.id,
            subjectId: ov.subjectId,
            startTime: ov.newTime || "09:00",
            endTime: "",
            room: null,
            subject: ov.subject,
            isOverride: true,
            overrideType: "extra",
          });
        }
        break;

      case "swap": {
        const idx = entries.findIndex((e) => e.subjectId === ov.subjectId);
        if (idx !== -1 && ov.newTime) {
          const swapPartnerOrig = ov.swapSubjectId ? originalBySubject.get(ov.swapSubjectId) : null;
          entries[idx] = {
            ...entries[idx],
            startTime: ov.newTime,
            endTime: swapPartnerOrig?.endTime || entries[idx].endTime,
            isOverride: true,
            overrideType: "swapped",
          };
        }
        break;
      }
    }
  }

  // Sort by new times
  entries.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Calculate goal priorities
  const todaysPlan: GoalClassPlan[] = [];

  for (const entry of entries) {
    const s = entry.subject;
    const effectivePresent = s.totalPresent + s.totalLate;
    const goalReq = goalPct / 100;

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
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
      currentPct: s.currentPercentage,
      projectedGoalPct: goalPct,
      priority,
      canSkipForGoal: Math.max(0, canSkipForGoal),
      scheduleId: entry.scheduleId,
      subjectId: entry.subjectId,
      isOverride: entry.isOverride,
      overrideType: entry.overrideType,
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
