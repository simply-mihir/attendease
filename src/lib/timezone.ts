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
 * - todayDate as a Date representing the user's local date (for display)
 * - dateStr as "YYYY-MM-DD"
 */
export function getUserToday(tz: string) {
  const now = new Date();

  // Get the date string in the user's timezone → "2026-08-04"
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);

  // Get the day-of-week string → "Tuesday"
  const dayName = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(now);

  // Build a Date whose local-time fields match the user's timezone
  const userNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const dayOfWeek = userNow.getDay();

  // Calculate the UTC offset for the user's timezone
  const offsetMs = userNow.getTime() - now.getTime();

  // User's midnight (start of day) in UTC
  const localMidnight = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
  const startOfDay = new Date(localMidnight.getTime() - offsetMs);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { dayOfWeek, startOfDay, endOfDay, todayDate: userNow, dateStr, dayName };
}
