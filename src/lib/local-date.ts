/**
 * Returns the current local date as "YYYY-MM-DD" string.
 * Unlike toISOString().slice(0,10), this uses the browser's local timezone,
 * avoiding the off-by-one bug near midnight when UTC date differs from local date.
 */
export function getLocalDateStr(d?: Date): string {
  const now = d || new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
