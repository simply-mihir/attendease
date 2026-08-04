export interface MergedClass {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  isOverride: boolean;
  overrideType: string | null;
  color?: string;
  [key: string]: any;
}

export interface ScheduleOverrideData {
  id: string;
  date: string | Date;
  subjectId: string;
  type: string; // "reschedule" | "cancel" | "extra" | "swap"
  originalTime: string | null;
  newTime: string | null;
  swapSubjectId: string | null;
  subject?: { id: string; name: string; code: string; colorHex?: string; streakCount?: number; currentPercentage?: number; minAttendancePct?: number; };
  swapSubject?: { id: string; name: string; code: string } | null;
}

function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse "HH:MM" to total minutes since midnight */
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

export function getClassesForDay(
  date: Date,
  regularSchedules: any[],
  overrides: ScheduleOverrideData[]
): MergedClass[] {
  const dayOfWeek = date.getDay();
  const dateStr = formatDateToYMD(date);

  // Build a lookup of original schedules by subjectId (before any mutations)
  const originalBySubject = new Map<string, { startTime: string; endTime: string }>();
  for (const s of regularSchedules) {
    const sid = s.subjectId || s.subject?.id;
    if (sid && (s.dayOfWeek === dayOfWeek || s.dayOfWeek === undefined)) {
      originalBySubject.set(sid, { startTime: s.startTime || "", endTime: s.endTime || "" });
    }
  }

  // Start with regular classes for this weekday
  let classes: MergedClass[] = regularSchedules
    .filter((s: any) => s.dayOfWeek === dayOfWeek || s.dayOfWeek === undefined)
    .map((s: any) => ({
      ...s, // Preserve existing properties like attendance status
      id: s.id || s.scheduleId,
      subjectId: s.subjectId,
      subjectName: s.subject?.name || s.subjectName || "",
      subjectCode: s.subject?.code || s.subjectCode || "",
      startTime: s.startTime || "",
      endTime: s.endTime || "",
      isOverride: false,
      overrideType: null,
      color: s.subject?.color || s.color || s.subject?.colorHex,
    }));

  // Find overrides for this specific date
  const dayOverrides = overrides.filter((o) => {
    return formatDateToYMD(new Date(o.date)) === dateStr;
  });

  // Apply each override
  for (const override of dayOverrides) {
    switch (override.type) {
      case "cancel":
        classes = classes.filter((c) => c.subjectId !== override.subjectId);
        break;

      case "reschedule": {
        const idx = classes.findIndex((c) => c.subjectId === override.subjectId);
        if (idx !== -1 && override.newTime) {
          // Preserve class duration: compute new endTime
          const orig = classes[idx];
          const duration = timeToMinutes(orig.endTime) - timeToMinutes(orig.startTime);
          const newEnd = duration > 0 ? minutesToTime(timeToMinutes(override.newTime) + duration) : orig.endTime;
          classes[idx] = {
            ...classes[idx],
            startTime: override.newTime,
            endTime: newEnd,
            isOverride: true,
            overrideType: "rescheduled",
          };
        } else if (idx === -1) {
          // Class not normally on this day — add it
          classes.push({
            id: override.id,
            subjectId: override.subjectId,
            subjectName: override.subject?.name || "",
            subjectCode: override.subject?.code || "",
            startTime: override.newTime || "09:00",
            endTime: "",
            isOverride: true,
            overrideType: "rescheduled",
            currentPct: override.subject?.currentPercentage || 100,
            minPct: override.subject?.minAttendancePct || 75,
            statusColor: "yellow",
            streakCount: override.subject?.streakCount || 0,
            colorHex: override.subject?.colorHex || "#ccc",
            attendanceMarked: false,
            attendanceStatus: null,
          });
        }
        break;
      }

      case "extra":
        classes.push({
          id: override.id,
          subjectId: override.subjectId,
          subjectName: override.subject?.name || "",
          subjectCode: override.subject?.code || "",
          startTime: override.newTime || "09:00",
          endTime: "",
          isOverride: true,
          overrideType: "extra",
          currentPct: override.subject?.currentPercentage || 100,
          minPct: override.subject?.minAttendancePct || 75,
          statusColor: "yellow",
          streakCount: override.subject?.streakCount || 0,
          colorHex: override.subject?.colorHex || "#ccc",
          attendanceMarked: false,
          attendanceStatus: null,
        });
        break;

      case "swap": {
        const swapIdx = classes.findIndex((c) => c.subjectId === override.subjectId);
        if (swapIdx !== -1 && override.newTime) {
          // Look up the swap partner's ORIGINAL endTime to get the full time slot
          const swapPartnerOrig = override.swapSubjectId
            ? originalBySubject.get(override.swapSubjectId)
            : null;
          classes[swapIdx] = {
            ...classes[swapIdx],
            startTime: override.newTime,
            endTime: swapPartnerOrig?.endTime || classes[swapIdx].endTime,
            isOverride: true,
            overrideType: "swapped",
          };
        }
        break;
      }
    }
  }

  classes.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  return classes;
}
