export interface MergedClass {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  isOverride: boolean;
  overrideType: string | null;
  [key: string]: any; // Allow arbitrary extra properties like attendance stats
}

export function getClassesForDay(
  date: Date,
  regularSchedules: any[],
  overrides: any[]
): MergedClass[] {
  const dayOfWeek = date.getDay();
  const dateStr = date.toISOString().split("T")[0];

  // Start with regular classes for this weekday (or if already filtered by the caller)
  let classes: MergedClass[] = regularSchedules
    .filter((s: any) => s.dayOfWeek === dayOfWeek || s.dayOfWeek === undefined)
    .map((s: any) => ({
      ...s, // Preserve existing properties like attendance status
      id: s.id || s.scheduleId,
      subjectId: s.subjectId,
      subjectName: s.subject?.name || s.subjectName || "",
      subjectCode: s.subject?.code || s.subjectCode || "",
      startTime: s.startTime,
      endTime: s.endTime,
      isOverride: false,
      overrideType: null,
    }));

  // Find overrides for this specific date
  const dayOverrides = overrides.filter((o: any) => {
    const d = new Date(o.date);
    return d.toISOString().split("T")[0] === dateStr;
  });

  for (const override of dayOverrides) {
    switch (override.type) {
      case "cancel":
        classes = classes.filter(c => c.subjectId !== override.subjectId);
        break;

      case "reschedule": {
        const idx = classes.findIndex(c => c.subjectId === override.subjectId);
        if (idx !== -1) {
          classes[idx] = {
            ...classes[idx],
            startTime: override.newTime || classes[idx].startTime,
            isOverride: true,
            overrideType: "rescheduled",
          };
        } else {
          classes.push({
            id: override.id,
            subjectId: override.subjectId,
            subjectName: override.subject?.name || "Unknown",
            subjectCode: override.subject?.code || "",
            startTime: override.newTime || "09:00",
            endTime: "",
            isOverride: true,
            overrideType: "rescheduled",
            // Include basic defaults for dashboard compatibility
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
          subjectName: override.subject?.name || "Unknown",
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
        const swapIdx = classes.findIndex(c => c.subjectId === override.subjectId);
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

  // Sort by start time
  classes.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  return classes;
}
