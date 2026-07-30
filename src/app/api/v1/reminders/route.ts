import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTelegram, formatReminderTelegram } from "@/lib/telegram";
import { sendEmail, formatReminderEmail } from "@/lib/email";

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
      select: { email: true, telegramChatId: true },
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
