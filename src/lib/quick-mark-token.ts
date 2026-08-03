import crypto from "crypto";

export function generateQuickMarkToken(
  userId: string,
  scheduleId: string,
  dateStr: string
): string {
  const secret = process.env.NEXTAUTH_SECRET || "";
  return crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${scheduleId}:${dateStr}`)
    .digest("hex")
    .substring(0, 32);
}
