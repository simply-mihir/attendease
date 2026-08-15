import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { sendTelegram } from "@/lib/telegram";

import { processChatbotMessage } from "@/lib/chatbot";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const username = message.from?.username || null;
    const text = message.text.trim();

    // Handle `/start {userId}` command for linking
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const userId = parts[1];

      if (!userId) return NextResponse.json({ ok: true });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ ok: true });

      await prisma.user.update({
        where: { id: userId },
        data: { telegramChatId: chatId, telegramUsername: username },
      });

      await prisma.notificationSetting.upsert({
        where: { userId },
        create: { userId, telegramEnabled: true },
        update: { telegramEnabled: true },
      });

      await sendTelegram(
        chatId,
        "✅ *AttendEase Connected!*\n\nYou'll now receive reminders here. You can also ask me anything about your attendance or schedule!"
      );

      return NextResponse.json({ ok: true });
    }

    // Handle normal chatbot queries
    const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
    
    if (!user) {
      await sendTelegram(chatId, "⚠️ *Account Not Linked*\n\nPlease link your AttendEase account first by visiting Settings -> Notifications in the web app.");
      return NextResponse.json({ ok: true });
    }

    // Call the internal chatbot logic
    const { reply } = await processChatbotMessage(user.id, text, []);
    
    // Send response back to Telegram
    await sendTelegram(chatId, reply);

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
