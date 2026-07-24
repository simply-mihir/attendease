export interface AttendanceStats {
  totalClasses: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalExcused: number;
  minRequiredPct: number;
}

export interface AttendanceResult {
  currentPercentage: number;
  effectivePresent: number;
  statusColor: "green" | "yellow" | "red";
  statusLabel: string;
  canSkipCount: number;
  mustAttendCount: number;
  isInDanger: boolean;
  bufferClasses: number;
}

export function calculateAttendance(stats: AttendanceStats): AttendanceResult {
  const { totalClasses, totalPresent, totalLate, minRequiredPct } = stats;
  const effectivePresent = totalPresent + totalLate;
  const currentPct = totalClasses === 0 ? 0 : (effectivePresent / totalClasses) * 100;
  const buffer = currentPct - minRequiredPct;

  const statusColor: "green" | "yellow" | "red" =
    buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red";

  const canSkip =
    buffer >= 0
      ? Math.floor(
          (effectivePresent - (minRequiredPct / 100) * totalClasses) /
            (minRequiredPct / 100)
        )
      : 0;

  const mustAttend =
    buffer < 0
      ? Math.ceil(
          ((minRequiredPct / 100) * totalClasses - effectivePresent) /
            (1 - minRequiredPct / 100)
        )
      : 0;

  return {
    currentPercentage: Math.round(currentPct * 100) / 100,
    effectivePresent,
    statusColor,
    statusLabel:
      statusColor === "green"
        ? "Safe Zone"
        : statusColor === "yellow"
        ? "Warning Zone"
        : "Danger Zone",
    canSkipCount: Math.max(0, canSkip),
    mustAttendCount: Math.max(0, mustAttend),
    isInDanger: statusColor === "red",
    bufferClasses: Math.max(0, canSkip),
  };
}

export function simulateSkip(
  stats: AttendanceStats,
  daysToSkip: number
): { newPercentage: number; newStatus: "green" | "yellow" | "red"; safe: boolean } {
  const effectivePresent = stats.totalPresent + stats.totalLate;
  const newTotal = stats.totalClasses + daysToSkip;
  const newPct = newTotal === 0 ? 0 : (effectivePresent / newTotal) * 100;
  const buffer = newPct - stats.minRequiredPct;
  return {
    newPercentage: Math.round(newPct * 100) / 100,
    newStatus: buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red",
    safe: newPct >= stats.minRequiredPct,
  };
}

export function simulateAttend(
  stats: AttendanceStats,
  classesToAttend: number
): { newPercentage: number; newStatus: "green" | "yellow" | "red"; safe: boolean } {
  const effectivePresent = stats.totalPresent + stats.totalLate + classesToAttend;
  const newTotal = stats.totalClasses + classesToAttend;
  const newPct = newTotal === 0 ? 0 : (effectivePresent / newTotal) * 100;
  const buffer = newPct - stats.minRequiredPct;
  return {
    newPercentage: Math.round(newPct * 100) / 100,
    newStatus: buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red",
    safe: newPct >= stats.minRequiredPct,
  };
}

export function isDangerZone(currentPct: number, minPct: number, buffer = 5): boolean {
  return currentPct <= minPct + buffer;
}
