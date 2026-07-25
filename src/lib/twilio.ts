import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM_WHATSAPP = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886"}`;

export async function sendWhatsApp(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log("[WhatsApp] Twilio not configured, skipping:", body);
    return null;
  }

  try {
    const message = await client.messages.create({
      from: FROM_WHATSAPP,
      to: `whatsapp:${to}`,
      body,
    });
    console.log(`[WhatsApp] Sent to ${to}: ${message.sid}`);
    return message.sid;
  } catch (err) {
    console.error("[WhatsApp] Send failed:", err);
    throw err;
  }
}

export function formatPreClassReminder(subjectName: string, startTime: string, room: string | null, currentPct: number, minPct: number) {
  const roomStr = room ? ` in ${room}` : "";
  const pctStatus = currentPct < minPct
    ? `⚠️ Your attendance is ${currentPct}% (below ${minPct}% minimum!)`
    : `✅ Attendance: ${currentPct}% (safe)`;

  return `📚 *AttendEase Reminder*\n\n${subjectName} starts at ${startTime}${roomStr}\n\n${pctStatus}\n\nDon't miss this class!`;
}

export function formatDangerAlert(subjectName: string, currentPct: number, minPct: number, mustAttend: number) {
  return `🚨 *Danger Alert — ${subjectName}*\n\nYour attendance has dropped to *${currentPct}%* (minimum: ${minPct}%)\n\nYou must attend the next *${mustAttend} classes* to recover.\n\nOpen AttendEase for details.`;
}

export function formatDailyBrief(classes: { name: string; time: string; room: string | null; pct: number }[], overallPct: number) {
  if (classes.length === 0) {
    return `☀️ *Good morning!*\n\nNo classes today. Enjoy your day off!\n\nOverall attendance: ${overallPct}%`;
  }

  const classLines = classes.map((c, i) => {
    const roomStr = c.room ? ` (${c.room})` : "";
    return `${i + 1}. ${c.name} — ${c.time}${roomStr} [${c.pct}%]`;
  }).join("\n");

  return `☀️ *Good morning! Here's your day:*\n\n${classLines}\n\nOverall attendance: ${overallPct}%\n\nHave a great day! 💪`;
}

export function formatWeeklyReport(stats: { name: string; pct: number; attended: number; total: number }[], overallPct: number) {
  const lines = stats.map((s) => {
    const emoji = s.pct >= 75 ? "✅" : s.pct >= 65 ? "⚠️" : "❌";
    return `${emoji} ${s.name}: ${s.pct}% (${s.attended}/${s.total})`;
  }).join("\n");

  return `📊 *Weekly Attendance Report*\n\n${lines}\n\n*Overall: ${overallPct}%*\n\nKeep it up! 🚀`;
}
