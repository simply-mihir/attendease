const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegram(chatId: string, text: string) {
  if (!BOT_TOKEN) {
    console.log("[Telegram] Bot token not configured, skipping:", text);
    return null;
  }

  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ description: "Telegram send failed" }));
    console.error("[Telegram] Send failed:", err);
    throw new Error(err.description || "Telegram send failed");
  }

  return res.json();
}

export function formatPreClassReminder(
  subjectName: string,
  startTime: string,
  room: string | null,
  currentPct: number,
  minPct: number
) {
  const roomStr = room ? ` in ${room}` : "";
  const pctStatus = currentPct < minPct
    ? `⚠️ Your attendance is ${currentPct}% (below ${minPct}% minimum!)`
    : `✅ Attendance: ${currentPct}% (safe)`;

  return `📚 *AttendEase Reminder*\n\n${subjectName} starts at ${startTime}${roomStr}\n\n${pctStatus}\n\nDon't miss this class!`;
}

export function formatDangerAlert(
  subjectName: string,
  currentPct: number,
  minPct: number,
  mustAttend: number
) {
  return `🚨 *Danger Alert — ${subjectName}*\n\nYour attendance has dropped to *${currentPct}%* (minimum: ${minPct}%)\n\nYou must attend the next *${mustAttend} classes* to recover.\n\nOpen AttendEase for details.`;
}

export function formatDailyBrief(
  classes: { name: string; time: string; room: string | null; pct: number }[],
  overallPct: number
) {
  if (classes.length === 0) {
    return `☀️ *Good morning!*\n\nNo classes today. Enjoy your day off!\n\nOverall attendance: ${overallPct}%`;
  }

  const classLines = classes.map((c, i) => {
    const roomStr = c.room ? ` (${c.room})` : "";
    return `${i + 1}. ${c.name} — ${c.time}${roomStr} [${c.pct}%]`;
  }).join("\n");

  return `☀️ *Good morning! Here's your day:*\n\n${classLines}\n\nOverall attendance: ${overallPct}%\n\nHave a great day! 💪`;
}

export function formatWeeklyReport(
  stats: { name: string; pct: number; attended: number; total: number }[],
  overallPct: number
) {
  const lines = stats.map((s) => {
    const emoji = s.pct >= 75 ? "✅" : s.pct >= 65 ? "⚠️" : "❌";
    return `${emoji} ${s.name}: ${s.pct}% (${s.attended}/${s.total})`;
  }).join("\n");

  return `📊 *Weekly Attendance Report*\n\n${lines}\n\n*Overall: ${overallPct}%*\n\nKeep it up! 🚀`;
}
