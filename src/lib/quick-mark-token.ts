import crypto from "crypto";

export function generateQuickMarkToken(
  userId: string,
  scheduleId: string
): string {
  const secret = process.env.NEXTAUTH_SECRET || "";
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${scheduleId}:${today}`)
    .digest("hex")
    .substring(0, 32);
}
