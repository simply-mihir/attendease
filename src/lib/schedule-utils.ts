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

export function getClassesForDay(
  date: Date,
  regularSchedules: any[],
  overrides: ScheduleOverrideData[]
): MergedClass[] {
  const dayOfWeek = date.getDay();
  const dateStr = formatDateToYMD(date);

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
        if (idx !== -1) {
          classes[idx] = {
            ...classes[idx],
            startTime: override.newTime || classes[idx].startTime,
            isOverride: true,
            overrideType: "rescheduled",
          };
        } else {
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
          classes[swapIdx] = {
            ...classes[swapIdx],
            startTime: override.newTime,
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
