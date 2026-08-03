import crypto from "crypto";

export function generateQuickMarkToken(
  userId: string,
  scheduleId: string,
  dateStr?: string
): string {
  const secret = process.env.NEXTAUTH_SECRET || "";
  // Use provided dateStr (timezone-aware) or fall back to local date formatting
  const today = dateStr || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${scheduleId}:${today}`)
    .digest("hex")
    .substring(0, 32);
}
