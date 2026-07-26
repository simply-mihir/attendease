import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { sendTelegram } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message;

    if (!message?.text?.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    const parts = message.text.split(" ");
    const userId = parts[1]; // /start {userId}

    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const username = message.from?.username || null;

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Update user record with Telegram connection details
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: chatId,
        telegramUsername: username,
      },
    });

    // Enable Telegram in notification settings
    await prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, telegramEnabled: true },
      update: { telegramEnabled: true },
    });

    // Send confirmation message to Telegram user
    await sendTelegram(
      chatId,
      "✅ *AttendEase Connected!*\n\nYou'll now receive:\n• Pre-class reminders\n• Danger zone alerts\n• Daily briefs\n\nManage settings in the app."
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook Error]:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { telegramChatId: true, telegramUsername: true },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "AttendEaseBot";

  return NextResponse.json({
    connected: !!dbUser?.telegramChatId,
    username: dbUser?.telegramUsername,
    connectUrl: `https://t.me/${botUsername}?start=${user.id}`,
  });
}
