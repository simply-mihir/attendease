const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "AttendEase <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log("[Email] Resend not configured, skipping:", subject);
    return null;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Email send failed" }));
    console.error("[Email] Send failed:", err);
    throw new Error(err.message || "Email send failed");
  }

  return res.json();
}

function emailWrapper(content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F1A; color: #F3F4F6; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 16px; }
          .logo { font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #7C3AED, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }
          .badge-green { background-color: rgba(34, 197, 94, 0.15); color: #4ADE80; border: 1px solid rgba(34, 197, 94, 0.3); }
          .badge-red { background-color: rgba(239, 68, 68, 0.15); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); }
          .badge-yellow { background-color: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.3); }
          .footer { margin-top: 28px; font-size: 12px; color: #9CA3AF; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px; }
          .class-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px 18px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎓 AttendEase</div>
          </div>
          ${content}
          <div class="footer">
            <p>Sent automatically by AttendEase — Smart Attendance Tracker.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function formatDailyBriefEmail(
  classes: { name: string; time: string; room: string | null; pct: number }[],
  overallPct: number
) {
  const subject = "☀️ Good morning! Here's your schedule for today";
  
  const classCards = classes.length === 0
    ? `<p style="color: #9CA3AF;">No classes today. Enjoy your day off!</p>`
    : classes.map((c) => `
        <div class="class-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 16px; color: #FFFFFF;">${c.name}</strong>
            <span class="badge ${c.pct >= 75 ? 'badge-green' : 'badge-red'}">${c.pct}%</span>
          </div>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #9CA3AF;">
            🕒 ${c.time} ${c.room ? `• 📍 Room ${c.room}` : ''}
          </p>
        </div>
      `).join("");

  const html = emailWrapper(`
    <h2 style="margin-top: 0; color: #FFFFFF; font-size: 22px;">Daily Class Brief</h2>
    ${classCards}
    <div style="margin-top: 20px; padding: 14px; background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 12px;">
      <p style="margin: 0; font-size: 14px; color: #D8B4FE;">
        📊 <strong>Overall Attendance:</strong> ${overallPct}%
      </p>
    </div>
  `);

  return { subject, html };
}

export function formatDangerAlertEmail(
  subjectName: string,
  currentPct: number,
  minPct: number,
  mustAttend: number
) {
  const subject = `🚨 Danger Alert: ${subjectName} is at ${currentPct}%`;

  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge badge-red" style="font-size: 14px; padding: 6px 14px;">DANGER ZONE WARNING</span>
    </div>
    <h2 style="margin-top: 0; color: #F87171; font-size: 22px; text-align: center;">${subjectName}</h2>
    <p style="font-size: 15px; color: #D1D5DB; line-height: 1.6; text-align: center;">
      Your attendance has dropped to <strong style="color: #F87171;">${currentPct}%</strong>, which is below your minimum threshold of <strong>${minPct}%</strong>.
    </p>
    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px; color: #FCA5A5;">
        ⚠️ You must attend the next <strong>${mustAttend} classes</strong> consecutively to reach ${minPct}%.
      </p>
    </div>
  `);

  return { subject, html };
}

export function formatWeeklyReportEmail(
  stats: { name: string; pct: number; attended: number; total: number }[],
  overallPct: number
) {
  const subject = `📊 Your Weekly Attendance Summary (${overallPct}%)`;

  const rows = stats.map((s) => `
    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
      <td style="padding: 12px 0; color: #FFFFFF; font-weight: 500;">${s.name}</td>
      <td style="padding: 12px 0; color: #9CA3AF; text-align: center;">${s.attended} / ${s.total}</td>
      <td style="padding: 12px 0; text-align: right;">
        <span class="badge ${s.pct >= 75 ? 'badge-green' : s.pct >= 65 ? 'badge-yellow' : 'badge-red'}">${s.pct}%</span>
      </td>
    </tr>
  `).join("");

  const html = emailWrapper(`
    <h2 style="margin-top: 0; color: #FFFFFF; font-size: 22px;">Weekly Report</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: left;">
          <th style="padding-bottom: 8px; color: #9CA3AF; font-size: 12px; text-transform: uppercase;">Subject</th>
          <th style="padding-bottom: 8px; color: #9CA3AF; font-size: 12px; text-transform: uppercase; text-align: center;">Attended</th>
          <th style="padding-bottom: 8px; color: #9CA3AF; font-size: 12px; text-transform: uppercase; text-align: right;">Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div style="padding: 16px; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; text-align: center;">
      <p style="margin: 0; font-size: 15px; color: #67E8F9;">
        🚀 <strong>Overall Attendance:</strong> ${overallPct}%
      </p>
    </div>
  `);

  return { subject, html };
}

export function formatReminderEmail(
  reminderTitle: string,
  dueDate: string,
  dueTime?: string,
  subjectName?: string,
  description?: string
) {
  const subject = `🔔 Reminder: ${reminderTitle}${subjectName ? ` (${subjectName})` : ''}`;

  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 16px;">
      <span class="badge badge-yellow" style="font-size: 14px; padding: 6px 14px;">TASK REMINDER</span>
    </div>
    <h2 style="margin-top: 0; color: #FFFFFF; font-size: 22px; text-align: center;">${reminderTitle}</h2>
    ${subjectName ? `<p style="text-align: center; color: #A78BFA; font-weight: 600; margin-top: -10px;">Subject: ${subjectName}</p>` : ''}
    
    <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #D1D5DB;">
        📅 <strong>Due Date:</strong> ${dueDate} ${dueTime ? `at ${dueTime}` : ''}
      </p>
      ${description ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #9CA3AF;">📝 ${description}</p>` : ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://attendease-c7wl.vercel.app/reminders" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #EC4899); color: #FFFFFF; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px;">
        Open Reminders
      </a>
    </div>
  `);

  return { subject, html };
}
