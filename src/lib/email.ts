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

function getGreeting(hours: number): string {
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}

// Neobrutalist / Pop Style Email Wrapper
function emailWrapper(userName: string | null, content: string, shadowColor = "#4cc9f0") {
  const name = userName || "Student";
  const now = new Date();
  const hours = now.getHours(); // Approximate greeting
  const greeting = getGreeting(hours);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d1a; color: #ffffff; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border: 3px solid #2a2a3d; border-radius: 20px; padding: 32px; box-shadow: 6px 6px 0px 0px ${shadowColor}; }
          .header { margin-bottom: 24px; }
          .greeting { font-size: 16px; font-weight: 700; color: #a1a1aa; margin-bottom: 8px; }
          .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; display: flex; align-items: center; gap: 8px; }
          .logo-accent { color: #ff2d78; }
          .card { background-color: #141425; border: 2px solid #2a2a3d; border-radius: 12px; padding: 16px 16px 16px 20px; margin-bottom: 20px; border-left: 5px solid #4cc9f0; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 900; border: 2px solid; text-transform: uppercase; }
          .badge-green { background-color: rgba(6, 214, 160, 0.1); color: #06d6a0; border-color: #06d6a0; }
          .badge-red { background-color: rgba(239, 71, 111, 0.1); color: #ef476f; border-color: #ef476f; }
          .badge-yellow { background-color: rgba(255, 209, 102, 0.1); color: #ffd166; border-color: #ffd166; }
          .badge-blue { background-color: rgba(76, 201, 240, 0.1); color: #4cc9f0; border-color: #4cc9f0; }
          .badge-purple { background-color: rgba(155, 93, 229, 0.1); color: #9b5de5; border-color: #9b5de5; }
          .footer { margin-top: 32px; font-size: 12px; color: #6b7280; font-weight: 700; text-align: center; border-top: 2px dashed #2a2a3d; padding-top: 24px; }
          h1, h2, h3 { font-weight: 900; letter-spacing: -0.5px; }
          p { line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="greeting">${greeting} ${name},</div>
          </div>
          ${content}
          <div class="footer">
            <p style="margin: 0 0 8px 0; color: #a1a1aa;">AttendEase — Smart Attendance Tracker</p>
            <a href="https://attendease-c7wl.vercel.app/" style="color: #4cc9f0; text-decoration: none;">https://attendease-c7wl.vercel.app/</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

// -------------------------------------------------------------
// FORMATTERS
// -------------------------------------------------------------

export function formatDailyBriefEmail(
  userName: string | null,
  classes: { name: string; time: string; room: string | null; pct: number; code?: string }[],
  overallPct: number,
  dateString: string
) {
  const subject = "📚 Today's Classes — AttendEase";
  
  const classCards = classes.length === 0
    ? `<div class="card" style="text-align: center; border-color: #4cc9f0; box-shadow: 4px 4px 0px 0px #4cc9f0;"><p style="font-weight: 700; color: #4cc9f0;">No classes today. Enjoy your day off! 🎉</p></div>`
    : classes.map((c) => {
        const leftColor = c.pct >= 75 ? '#06d6a0' : c.pct >= 60 ? '#ffd166' : '#ef476f';
        return `
        <div class="card" style="border-left-color: ${leftColor}; box-shadow: 4px 4px 0px 0px ${leftColor}33;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <strong style="font-size: 16px; color: #FFFFFF; font-weight: 900;">${c.name}${c.code ? ` (${c.code})` : ""}</strong>
            <span class="badge ${c.pct >= 75 ? 'badge-green' : c.pct >= 60 ? 'badge-yellow' : 'badge-red'}">${c.pct}%</span>
          </div>
          <div style="font-size: 14px; color: #a1a1aa; font-weight: 700;">
            <span style="color: #06d6a0;">🕒 ${c.time}</span>
            ${c.room ? `<span style="margin-left: 12px; color: #ffd166;">📍 ${c.room}</span>` : ''}
          </div>
        </div>
      `;}).join("");

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 8px 0; color: #9b5de5; font-size: 28px;">Daily Brief</h1>
    <p style="color: #a1a1aa; font-weight: 700; margin: 0 0 24px 0;">${dateString}</p>
    ${classCards}
    <div style="margin-top: 24px; padding: 16px; background-color: #141425; border: 3px solid #9b5de5; border-radius: 16px; text-align: center; box-shadow: 4px 4px 0px 0px #9b5de5;">
      <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 900;">
        Overall Attendance: <span style="color: #9b5de5; font-size: 20px;">${overallPct}%</span>
      </p>
    </div>
  `, "#9b5de5");

  return { subject, html };
}

export function formatPreClassEmail(
  userName: string | null,
  className: string,
  minsUntil: number,
  sch: { startTime: string; endTime: string; room: string | null }
) {
  const subject = `⏰ ${className} in ${minsUntil} min`;

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 8px 0; color: #4cc9f0; font-size: 28px;">${className}</h1>
    <p style="font-size: 20px; font-weight: 900; margin: 0 0 24px 0; color: #ffffff;">Starts in <span style="color: #ff2d78;">${minsUntil} minutes</span></p>
    
    <div class="card" style="border-color: #4cc9f0; box-shadow: 4px 4px 0px 0px #4cc9f0;">
      <p style="margin: 0 0 8px 0; font-weight: 900; color: #ffffff;">🕒 ${sch.startTime} - ${sch.endTime}</p>
      <p style="margin: 0; font-weight: 700; color: #a1a1aa;">📍 ${sch.room || "No room specified"}</p>
    </div>
    
    <div style="margin-top: 24px; text-align: center;">
      <a href="https://attendease-c7wl.vercel.app/" style="display: inline-block; background-color: #4cc9f0; color: #0d0d1a; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 16px; border: 2px solid #ffffff;">
        Open AttendEase
      </a>
    </div>
  `, "#4cc9f0");

  return { subject, html };
}

export function formatDangerAlertEmail(
  userName: string | null,
  subjects: any[]
) {
  const subject = `⚠️ Danger Alert: ${subjects.length} subjects below minimum`;

  const rows = subjects.map((s) => {
    const pct = s.totalClassesHeld > 0 ? Math.round((s.totalPresent / s.totalClassesHeld) * 100) : 0;
    return `
      <div class="card" style="border-color: #ef476f; box-shadow: 4px 4px 0px 0px #ef476f;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #ef476f; font-size: 16px; font-weight: 900;">${s.name}</strong>
          <span class="badge badge-red">${pct}%</span>
        </div>
        <p style="margin: 0; font-weight: 700; color: #a1a1aa; font-size: 14px;">
          Need <strong style="color: #ffffff;">${s.minAttendancePct || 75}%</strong> • Attended ${s.totalPresent}/${s.totalClassesHeld}
        </p>
      </div>
    `;
  }).join("");

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 16px 0; color: #ef476f; font-size: 28px;">Danger Zone</h1>
    <p style="font-weight: 700; color: #ffffff; margin-bottom: 24px;">The following subjects are below your minimum target attendance.</p>
    ${rows}
    <div style="margin-top: 24px; text-align: center;">
      <a href="https://attendease-c7wl.vercel.app/" style="display: inline-block; background-color: #ef476f; color: #ffffff; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 16px; border: 2px solid #ffffff;">
        View Recovery Plan
      </a>
    </div>
  `, "#ef476f");

  return { subject, html };
}

export function formatWeeklyReportEmail(
  userName: string | null,
  subjects: any[]
) {
  let tA = 0, tC = 0;
  const rows = subjects.map((s) => {
    const pct = s.totalClassesHeld > 0 ? Math.round((s.totalPresent / s.totalClassesHeld) * 100) : 0;
    tA += s.totalPresent; tC += s.totalClassesHeld;
    const badge = pct >= 75 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red';
    const leftColor = pct >= 75 ? '#06d6a0' : pct >= 60 ? '#ffd166' : '#ef476f';
    return `
      <div class="card" style="border-left-color: ${leftColor}; box-shadow: 4px 4px 0px 0px ${leftColor}33;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #ffffff; font-size: 16px; font-weight: 900;">${s.name}</strong>
          <span class="badge ${badge}">${pct}%</span>
        </div>
        <p style="margin: 0; font-weight: 700; color: #a1a1aa; font-size: 14px;">
          Attended: ${s.totalPresent} / ${s.totalClassesHeld} classes
        </p>
      </div>
    `;
  }).join("");
  const overall = tC > 0 ? Math.round((tA / tC) * 100) : 0;

  const subject = `📊 Your Weekly Attendance Summary (${overall}%)`;

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 16px 0; color: #06d6a0; font-size: 28px;">Weekly Report</h1>
    ${rows}
    <div style="margin-top: 24px; padding: 16px; background-color: #141425; border: 3px solid #06d6a0; border-radius: 16px; text-align: center; box-shadow: 4px 4px 0px 0px #06d6a0;">
      <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 900;">
        Overall Attendance: <span style="color: #06d6a0; font-size: 24px;">${overall}%</span>
      </p>
    </div>
  `, "#06d6a0");

  return { subject, html };
}

export function formatDailyReportEmail(
  userName: string | null,
  classes: any[],
  present: number,
  absent: number,
  unmarked: number,
  dateString: string
) {
  const subject = `Daily Report — ${dateString}`;

  const rows = classes.length === 0
    ? `<div class="card" style="text-align: center; border-color: #9b5de5; box-shadow: 4px 4px 0px 0px #9b5de5;"><p style="font-weight: 700; color: #9b5de5;">No classes were scheduled for today.</p></div>`
    : classes.map((c) => {
        const badge = c.status === "PRESENT" ? "badge-green" : c.status === "LATE" ? "badge-yellow" : c.status === "ABSENT" ? "badge-red" : "badge-blue";
        const leftColor = c.status === "PRESENT" ? '#06d6a0' : c.status === "LATE" ? '#ffd166' : c.status === "ABSENT" ? '#ef476f' : '#4cc9f0';
        return `
          <div class="card" style="border-left-color: ${leftColor}; box-shadow: 4px 4px 0px 0px ${leftColor}33;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <strong style="color: #ffffff; font-size: 16px; font-weight: 900;">${c.subjectName}${c.code ? ` (${c.code})` : ""}</strong>
              <span class="badge ${badge}">${c.status}</span>
            </div>
            <p style="margin: 0; font-weight: 900; color: #a1a1aa; font-size: 14px;">
              <span style="color: #4cc9f0;">🕒 ${c.startTime}</span>
            </p>
          </div>
        `;
      }).join("");

  const total = classes.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const pctColor = pct >= 75 ? "#06d6a0" : pct >= 50 ? "#ffd166" : "#ef476f";

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 8px 0; color: #9b5de5; font-size: 28px;">Daily Report</h1>
    <p style="color: #a1a1aa; font-weight: 700; margin: 0 0 24px 0;">${dateString}</p>
    ${rows}
    <div style="margin-top: 24px; display: flex; gap: 12px; margin-bottom: 12px;">
      <div style="flex: 1; background: #141425; border: 2px solid #06d6a0; border-radius: 12px; padding: 12px; text-align: center;">
        <div style="color: #06d6a0; font-size: 24px; font-weight: 900;">${present}</div>
        <div style="color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;">Present</div>
      </div>
      <div style="flex: 1; background: #141425; border: 2px solid #ef476f; border-radius: 12px; padding: 12px; text-align: center;">
        <div style="color: #ef476f; font-size: 24px; font-weight: 900;">${absent}</div>
        <div style="color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;">Absent</div>
      </div>
      <div style="flex: 1; background: #141425; border: 2px solid #a1a1aa; border-radius: 12px; padding: 12px; text-align: center;">
        <div style="color: #ffffff; font-size: 24px; font-weight: 900;">${unmarked}</div>
        <div style="color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;">Unmarked</div>
      </div>
    </div>
    <div style="padding: 16px; background-color: #141425; border: 3px solid ${pctColor}; border-radius: 16px; text-align: center; box-shadow: 4px 4px 0px 0px ${pctColor};">
      <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 900;">
        Today's Attendance: <span style="color: ${pctColor}; font-size: 24px;">${pct}%</span>
      </p>
    </div>
  `, "#9b5de5");

  return { subject, html };
}

export function formatAttendanceMarkedEmail(
  userName: string | null,
  subjectName: string,
  status: string,
  dateStr: string
) {
  const statusUpper = status.toUpperCase();
  const subject = `Attendance Update: ${subjectName} — AttendEase`;
  const badge = statusUpper === "PRESENT" ? "badge-green" : statusUpper === "LATE" ? "badge-yellow" : statusUpper === "ABSENT" ? "badge-red" : "badge-blue";
  const shadow = statusUpper === "PRESENT" ? "#06d6a0" : statusUpper === "LATE" ? "#ffd166" : statusUpper === "ABSENT" ? "#ef476f" : "#4cc9f0";

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 24px 0; color: #9b5de5; font-size: 28px;">Attendance Marked</h1>
    
    <div class="card" style="border-color: ${shadow}; box-shadow: 4px 4px 0px 0px ${shadow}; padding: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #ffffff;">${subjectName}</h2>
      <p style="margin: 0 0 12px 0; font-weight: 900; color: #a1a1aa; font-size: 15px;">
        Status: <span class="badge ${badge}" style="font-size: 14px;">${statusUpper}</span>
      </p>
      <p style="margin: 0; font-weight: 700; color: #a1a1aa; font-size: 14px;">
        Date: <span style="color: #ffffff;">${dateStr}</span>
      </p>
    </div>
  `, shadow);

  return { subject, html };
}

export function formatAttendanceFailedEmail(
  userName: string | null,
  subjectName: string,
  errorMessage: string
) {
  const subject = `Action Required: Attendance Update Failed — AttendEase`;

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 24px 0; color: #ef476f; font-size: 28px;">Update Failed</h1>
    
    <div class="card" style="border-color: #ef476f; box-shadow: 4px 4px 0px 0px #ef476f; padding: 24px;">
      <p style="margin: 0 0 12px 0; font-weight: 700; color: #ffffff; font-size: 16px; line-height: 1.5;">
        We encountered an error while trying to automatically update your attendance for <strong>${subjectName}</strong>.
      </p>
      <div style="background: rgba(239, 71, 111, 0.1); border: 2px solid #ef476f; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <p style="margin: 0; font-weight: 900; color: #ef476f; font-family: monospace;">${errorMessage}</p>
      </div>
      <p style="margin: 0; font-weight: 700; color: #a1a1aa; font-size: 14px;">
        Please log into the app and mark your attendance manually.
      </p>
    </div>
  `, "#ef476f");

  return { subject, html };
}

export function formatGenericNoticeEmail(
  userName: string | null,
  title: string,
  message: string,
  shadowColor = "#ff2d78"
) {
  const subject = `${title} — AttendEase`;

  const html = emailWrapper(userName, `
    <h1 style="margin: 0 0 24px 0; color: ${shadowColor}; font-size: 28px;">${title}</h1>
    
    <div class="card" style="border-color: ${shadowColor}; box-shadow: 4px 4px 0px 0px ${shadowColor}; padding: 24px;">
      <p style="margin: 0; font-weight: 700; color: #ffffff; font-size: 16px; line-height: 1.6;">
        ${message}
      </p>
    </div>
  `, shadowColor);

  return { subject, html };
}

export function formatReminderEmail(
  userName: string | null,
  reminderTitle: string,
  dueDate: string,
  dueTime?: string,
  subjectName?: string,
  description?: string
) {
  const subject = `🔔 Reminder: ${reminderTitle}${subjectName ? ` (${subjectName})` : ''}`;

  const html = emailWrapper(userName, `
    <div style="margin-bottom: 16px;">
      <span class="badge badge-yellow">TASK REMINDER</span>
    </div>
    <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px;">${reminderTitle}</h1>
    ${subjectName ? `<p style="color: #9b5de5; font-weight: 900; margin: 0 0 24px 0; font-size: 16px;">${subjectName}</p>` : '<div style="margin-bottom: 24px;"></div>'}
    
    <div class="card" style="border-color: #ffd166; box-shadow: 4px 4px 0px 0px #ffd166; padding: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 16px; color: #ffffff; font-weight: 900;">
        <span style="color: #ffd166;">📅 Due Date:</span> ${dueDate} ${dueTime ? `at ${dueTime}` : ''}
      </p>
      ${description ? `<p style="margin: 0; font-size: 15px; font-weight: 700; color: #a1a1aa; line-height: 1.5;">${description}</p>` : ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://attendease-c7wl.vercel.app/reminders" style="display: inline-block; background-color: #ffd166; color: #0d0d1a; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 16px; border: 2px solid #ffffff;">
        Open Reminders
      </a>
    </div>
  `, "#ffd166");

  return { subject, html };
}
