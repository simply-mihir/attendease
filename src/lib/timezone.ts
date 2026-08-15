import { prisma } from "./db";

/**
 * Get the user's timezone from DB (default: Asia/Kolkata).
 */
export async function getUserTimezone(userId: string): Promise<string> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return row?.timezone || "Asia/Kolkata";
}

/**
 * Returns today's date info in the user's timezone:
 * - dayOfWeek (0=Sun … 6=Sat)
 * - startOfDay / endOfDay as UTC Date objects (for Prisma queries)
 * - todayDate as a Date representing the user's local date
 * - dateStr as "YYYY-MM-DD"
 * - dayName as full weekday name
 *
 * Uses Intl.DateTimeFormat.formatToParts() for reliable cross-platform
 * timezone conversion (avoids locale-string parsing which breaks on some
 * Node.js versions / Vercel runtimes).
 */
export function getUserToday(tz: string, offsetDays: number = 0) {
  const now = new Date();
  if (offsetDays !== 0) now.setDate(now.getDate() + offsetDays);

  // Extract individual date/time parts in the user's timezone
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const partsArr = fmt.formatToParts(now);
  const parts: Record<string, string> = {};
  for (const p of partsArr) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }

  const year = parseInt(parts.year);
  const month = parseInt(parts.month) - 1; // 0-indexed
  const day = parseInt(parts.day);
  // hour12:false can return "24" for midnight on some engines
  const hour = parts.hour === "24" ? 0 : parseInt(parts.hour);
  const minute = parseInt(parts.minute);
  const second = parseInt(parts.second);

  // Build UTC timestamps that represent the user's local time
  const userLocalAsUtc = new Date(Date.UTC(year, month, day, hour, minute, second));
  const dayOfWeek = userLocalAsUtc.getUTCDay();

  // Offset = (user local time as UTC) - (actual UTC)
  const offsetMs = userLocalAsUtc.getTime() - now.getTime();

  // Midnight in user's timezone → converted to actual UTC for Prisma queries
  const midnightUtc = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const startOfDay = new Date(midnightUtc.getTime() - offsetMs);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[dayOfWeek];

  return { dayOfWeek, startOfDay, endOfDay, todayDate: userLocalAsUtc, dateStr, dayName };
}
