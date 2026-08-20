import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTelegram, formatReminderTelegram } from "@/lib/telegram";
import { sendEmail, formatReminderEmail } from "@/lib/email";
import { getUserTimezone, getUserToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get("subjectId");
  const category = searchParams.get("category");
  const completed = searchParams.get("completed");

  const where: any = { userId: user.id };
  if (subjectId) where.subjectId = subjectId;
  if (category) where.category = category;
  if (completed !== null && completed !== undefined) {
    where.isCompleted = completed === "true";
  }

  // Auto-complete past due reminders
  const tz = await getUserTimezone(user.id);
  const { dateStr } = getUserToday(tz);
  
  const now = new Date();
  const fmtTime = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = fmtTime.formatToParts(now);
  let hour = parts.find(p => p.type === "hour")?.value || "00";
  if (hour === "24") hour = "00";
  const minute = parts.find(p => p.type === "minute")?.value || "00";
  const timeStr = `${hour}:${minute}`;

  const uncompleted = await prisma.reminder.findMany({
    where: { userId: user.id, isCompleted: false },
    select: { id: true, dueDate: true, dueTime: true }
  });

  const toComplete = uncompleted.filter(r => {
    const rDateStr = r.dueDate.toISOString().slice(0, 10);
    if (rDateStr < dateStr) return true;
    if (rDateStr === dateStr && r.dueTime && r.dueTime < timeStr) return true;
    return false;
  });

  if (toComplete.length > 0) {
    await prisma.reminder.updateMany({
      where: { id: { in: toComplete.map(r => r.id) } },
      data: { isCompleted: true }
    });
  }

  const reminders = await prisma.reminder.findMany({
    where,
    include: {
      subject: {
        select: { id: true, name: true, colorHex: true, code: true },
      },
    },
    orderBy: [
      { isCompleted: "asc" },
      { dueDate: "asc" },
      { dueTime: "asc" },
    ],
  });

  return NextResponse.json({ reminders });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      dueDate,
      dueTime,
      priority,
      subjectId,
      notifyPush = true,
      notifyAlarm = true,
      notifyEmail = false,
      notifyTelegram = false,
    } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and dueDate are required" }, { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "other",
        dueDate: new Date(dueDate),
        dueTime: dueTime || null,
        priority: priority || "medium",
        notifyPush: Boolean(notifyPush),
        notifyAlarm: Boolean(notifyAlarm),
        notifyEmail: Boolean(notifyEmail),
        notifyTelegram: Boolean(notifyTelegram),
      },
      include: {
        subject: {
          select: { id: true, name: true, colorHex: true, code: true },
        },
      },
    });

    // Send immediate Telegram alert if opt-in and user has Telegram chatId
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, telegramChatId: true }
    });

    if (notifyTelegram && dbUser?.telegramChatId) {
      try {
        const msg = formatReminderTelegram(
          reminder.title,
          reminder.dueDate.toISOString().slice(0, 10),
          reminder.dueTime || undefined,
          reminder.subject?.name,
          reminder.description || undefined
        );
        await sendTelegram(dbUser.telegramChatId, msg);
      } catch (err) {
        console.error("Telegram reminder dispatch failed:", err);
      }
    }

    // Send immediate Email alert if opt-in and user has email
    if (notifyEmail && dbUser?.email) {
      try {
        const emailContent = formatReminderEmail(
          dbUser.name,
          reminder.title,
          reminder.dueDate.toISOString().slice(0, 10),
          reminder.dueTime || undefined,
          reminder.subject?.name,
          reminder.description || undefined
        );
        await sendEmail(dbUser.email, emailContent.subject, emailContent.html);
      } catch (err) {
        console.error("Email reminder dispatch failed:", err);
      }
    }

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err: any) {
    console.error("Create reminder error:", err);
    return NextResponse.json({ error: err.message || "Failed to create reminder" }, { status: 500 });
  }
}
