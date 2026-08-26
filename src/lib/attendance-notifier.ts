import { prisma } from "./db";
import { sendEmail, formatAttendanceMarkedEmail, formatAttendanceFailedEmail } from "./email";
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

    const promises = [];

    if (ns.telegramEnabled && user.telegramChatId) {
      promises.push(sendTelegram(user.telegramChatId, `${textTitle}\n\n${textMsg}`).catch(e => console.error("Telegram notify failed", e)));
    }

    if (ns.emailEnabled && user.email) {
      const { subject, html } = formatAttendanceMarkedEmail(user.name, subjectName, status, dateStr);
      promises.push(sendEmail(user.email, subject, html).catch(e => console.error("Email notify failed", e)));
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
    const promises = [];

    if (ns.telegramEnabled && user.telegramChatId) {
      promises.push(sendTelegram(user.telegramChatId, `${textTitle}\n\n${textMsg}`).catch(e => console.error("Telegram notify failed", e)));
    }

    if (ns.emailEnabled && user.email) {
      const { subject, html } = formatAttendanceFailedEmail(user.name, subjectName, errorMessage);
      promises.push(sendEmail(user.email, subject, html).catch(e => console.error("Email notify failed", e)));
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

export async function notifyUserModification(
  userId: string,
  title: string,
  message: string
) {
  try {
    const user = await getUserInfo(userId);
    if (!user || !user.notificationSetting) return;

    const ns = user.notificationSetting;
    if (!ns.emailEnabled && !ns.telegramEnabled && !ns.pushEnabled) return;

    const promises = [];

    // 1. Telegram
    if (ns.telegramEnabled && user.telegramChatId) {
      const textTitle = `[ ${title} ]`;
      promises.push(sendTelegram(user.telegramChatId, `${textTitle}\n\n${message}`).catch(e => console.error("Telegram notify failed", e)));
    }

    // 2. Email
    if (ns.emailEnabled && user.email) {
      const { formatGenericNoticeEmail } = await import("./email");
      const { subject, html } = formatGenericNoticeEmail(user.name, title, message);
      promises.push(sendEmail(user.email, subject, html).catch(e => console.error("Email notify failed", e)));
    }

    // 3. Push Notifications
    if (ns.pushEnabled && user.pushSubscriptions.length > 0) {
      const pushPayload = {
        title,
        body: message,
        tag: `mod-${Date.now()}`,
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
    console.error("[notifyUserModification] Error:", error);
  }
}
