import { prisma } from "./db";
import { sendEmail } from "./email";
import { sendTelegram } from "./telegram";
import { sendPushNotification } from "./push";

function getGreeting(hours: number): string {
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}

function getIconForStatus(status: string): string {
  switch (status.toUpperCase()) {
    case "PRESENT": return "[✓]";
    case "LATE": return "[⏱]";
    case "ABSENT": return "[✕]";
    default: return "[−]";
  }
}

function getHtmlIconForStatus(status: string): string {
  switch (status.toUpperCase()) {
    case "PRESENT": return "&#10003;"; // Checkmark
    case "LATE": return "&#9202;"; // Stopwatch
    case "ABSENT": return "&#10007;"; // Cross
    default: return "&#8211;"; // Dash
  }
}

function getHtmlColorForStatus(status: string): string {
  switch (status.toUpperCase()) {
    case "PRESENT": return "#22C55E";
    case "LATE": return "#EAB308";
    case "ABSENT": return "#EF4444";
    default: return "#6B7280";
  }
}

async function getUserInfo(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      notificationSetting: true,
      pushSubscriptions: true,
    }
  });
}

export async function notifyAttendanceMarked(
  userId: string,
  subjectName: string,
  status: string,
  dateStr: string
) {
  try {
    const user = await getUserInfo(userId);
    if (!user || !user.notificationSetting) return;

    const ns = user.notificationSetting;
    if (!ns.emailEnabled && !ns.telegramEnabled && !ns.pushEnabled) return;

    const tz = user.timezone || "Asia/Kolkata";
    const now = new Date();
    const hourStr = now.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false });
    const hours = parseInt(hourStr) || 0;
    
    const greeting = getGreeting(hours);
    const name = user.name || "Student";
    const statusUpper = status.toUpperCase();
    
    const textTitle = `[ Attendance Marked ]`;
    const textMsg = `${greeting}, ${name}\n\n${getIconForStatus(statusUpper)} *${subjectName}*\nStatus: ${statusUpper} on ${dateStr}\n\nRegards,\nTeam AttendEase\nhttps://attendease-c7wl.vercel.app/`;

    const htmlTitle = `Attendance Marked`;
    const htmlMsg = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0B0F1A; padding: 24px; border-radius: 16px; color: #fff;">
        <p style="color:#E5E7EB;font-size:16px;margin:0 0 16px;">${greeting}, ${name}</p>
        <h2 style="color: #7C3AED; margin: 0 0 16px;">${htmlTitle}</h2>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#fff;">${subjectName}</p>
          <p style="margin:0;color:#9CA3AF;">Status: <span style="color:${getHtmlColorForStatus(statusUpper)};font-weight:700;">${getHtmlIconForStatus(statusUpper)} ${statusUpper}</span></p>
          <p style="margin:8px 0 0;color:#9CA3AF;font-size:13px;">Date: ${dateStr}</p>
        </div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);color:#9CA3AF;font-size:13px;">
          <p style="margin:0 0 4px;">Regards,</p>
          <p style="margin:0 0 8px;font-weight:bold;color:#E5E7EB;">Team AttendEase</p>
          <a href="https://attendease-c7wl.vercel.app/" style="color:#7C3AED;text-decoration:none;">https://attendease-c7wl.vercel.app/</a>
        </div>
      </div>
    `;

    const promises = [];

    if (ns.telegramEnabled && user.telegramChatId) {
      promises.push(sendTelegram(user.telegramChatId, `${textTitle}\n\n${textMsg}`).catch(e => console.error("Telegram notify failed", e)));
    }

    if (ns.emailEnabled && user.email) {
      promises.push(sendEmail(user.email, `Attendance Update: ${subjectName} — AttendEase`, htmlMsg).catch(e => console.error("Email notify failed", e)));
    }

    if (ns.pushEnabled && user.pushSubscriptions.length > 0) {
      const pushPayload = {
        title: `Attendance Marked: ${statusUpper}`,
        body: `${subjectName} on ${dateStr}`,
        tag: `attendance-${Date.now()}`,
        data: { url: "/dashboard" }
      };
      
      for (const sub of user.pushSubscriptions) {
        promises.push(
          sendPushNotification(sub, pushPayload).catch(async (e) => {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          })
        );
      }
    }

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("[notifyAttendanceMarked] Error:", error);
  }
}

export async function notifyAttendanceFailed(
  userId: string,
  subjectName: string,
  errorMessage: string
) {
  try {
    const user = await getUserInfo(userId);
    if (!user || !user.notificationSetting) return;

    const ns = user.notificationSetting;
    if (!ns.emailEnabled && !ns.telegramEnabled && !ns.pushEnabled) return;

    const tz = user.timezone || "Asia/Kolkata";
    const now = new Date();
    const hourStr = now.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false });
    const hours = parseInt(hourStr) || 0;
    
    const greeting = getGreeting(hours);
    const name = user.name || "Student";
    
    const textTitle = `[ Attendance Update Failed ]`;
    const textMsg = `${greeting}, ${name}\n\nWe encountered an error while updating your attendance for *${subjectName}*.\nError: ${errorMessage}\n\nPlease try again manually via the AttendEase dashboard.\n\nRegards,\nTeam AttendEase\nhttps://attendease-c7wl.vercel.app/`;

    const htmlTitle = `Attendance Update Failed`;
    const htmlMsg = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0B0F1A; padding: 24px; border-radius: 16px; color: #fff;">
        <p style="color:#E5E7EB;font-size:16px;margin:0 0 16px;">${greeting}, ${name}</p>
        <h2 style="color: #EF4444; margin: 0 0 16px;">${htmlTitle}</h2>
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#fff;">Subject: ${subjectName}</p>
          <p style="margin:0;color:#FCA5A5;">Error: ${errorMessage}</p>
        </div>
        <p style="color:#9CA3AF;font-size:14px;">Please try again manually via the AttendEase dashboard.</p>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);color:#9CA3AF;font-size:13px;">
          <p style="margin:0 0 4px;">Regards,</p>
          <p style="margin:0 0 8px;font-weight:bold;color:#E5E7EB;">Team AttendEase</p>
          <a href="https://attendease-c7wl.vercel.app/" style="color:#7C3AED;text-decoration:none;">https://attendease-c7wl.vercel.app/</a>
        </div>
      </div>
    `;

    const promises = [];

    if (ns.telegramEnabled && user.telegramChatId) {
      promises.push(sendTelegram(user.telegramChatId, `${textTitle}\n\n${textMsg}`).catch(e => console.error("Telegram notify failed", e)));
    }

    if (ns.emailEnabled && user.email) {
      promises.push(sendEmail(user.email, `Action Required: Attendance Update Failed — AttendEase`, htmlMsg).catch(e => console.error("Email notify failed", e)));
    }

    if (ns.pushEnabled && user.pushSubscriptions.length > 0) {
      const pushPayload = {
        title: `Attendance Failed`,
        body: `${subjectName}: ${errorMessage}`,
        tag: `attendance-failed-${Date.now()}`,
        data: { url: "/dashboard" }
      };
      
      for (const sub of user.pushSubscriptions) {
        promises.push(
          sendPushNotification(sub, pushPayload).catch(async (e) => {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          })
        );
      }
    }

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("[notifyAttendanceFailed] Error:", error);
  }
}
