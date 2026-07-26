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
  reasoning: string;
}

export function calculateAttendance(stats: AttendanceStats): AttendanceResult {
  const { totalClasses, totalPresent, totalLate, minRequiredPct } = stats;
  const effectivePresent = totalPresent + totalLate;
  const currentPct = totalClasses === 0 ? 0 : (effectivePresent / totalClasses) * 100;
  const buffer = currentPct - minRequiredPct;

  const statusColor: "green" | "yellow" | "red" =
    buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red";

  const req = minRequiredPct / 100;

  const canSkip = buffer >= 0 ? Math.floor((effectivePresent - req * totalClasses) / req) : 0;
  const mustAttend = buffer < 0 ? Math.ceil((req * totalClasses - effectivePresent) / (1 - req)) : 0;

  const canSkipCount = Math.max(0, canSkip);
  const mustAttendCount = Math.max(0, mustAttend);
  const isInDanger = statusColor === "red";

  let reasoning = "";
  if (totalClasses === 0) {
    reasoning = `You haven't had any classes yet!`;
  } else if (isInDanger) {
    const newT = totalClasses + mustAttendCount;
    const newP = effectivePresent + mustAttendCount;
    const newPct = Math.round((newP / newT) * 10000) / 100;
    reasoning = `You have ${effectivePresent}/${totalClasses} (${Math.round(currentPct * 100) / 100}%). By attending the next ${mustAttendCount} classes, you will reach ${newP}/${newT} (${newPct}%), meeting your ${minRequiredPct}% requirement.`;
  } else {
    if (canSkipCount === 0) {
      const dropPct = Math.round((effectivePresent / (totalClasses + 1)) * 10000) / 100;
      reasoning = `You have ${effectivePresent}/${totalClasses} (${Math.round(currentPct * 100) / 100}%). If you skip the very next class, it drops to ${effectivePresent}/${totalClasses + 1} (${dropPct}%), which is below your ${minRequiredPct}% requirement.`;
    } else {
      const newT = totalClasses + canSkipCount;
      const newPct = Math.round((effectivePresent / newT) * 10000) / 100;
      reasoning = `You have ${effectivePresent}/${totalClasses} (${Math.round(currentPct * 100) / 100}%). If you skip ${canSkipCount} classes, your attendance becomes ${effectivePresent}/${newT} (${newPct}%), staying safe!`;
    }
  }

  return {
    currentPercentage: Math.round(currentPct * 100) / 100,
    effectivePresent,
    statusColor,
    statusLabel: statusColor === "green" ? "Safe Zone" : statusColor === "yellow" ? "Warning Zone" : "Danger Zone",
    canSkipCount,
    mustAttendCount,
    isInDanger,
    bufferClasses: canSkipCount,
    reasoning,
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
