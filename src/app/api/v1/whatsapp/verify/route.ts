import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { phoneNumber } = await req.json();

  if (!phoneNumber || !/^\+\d{10,15}$/.test(phoneNumber)) {
    return NextResponse.json({ error: "Invalid phone number. Use format: +919876543210" }, { status: 400 });
  }

  // Send verification message
  try {
    await sendWhatsApp(
      phoneNumber,
      `🎓 *AttendEase Verification*\n\nHi! This confirms your WhatsApp number is linked to your AttendEase account.\n\nYou'll now receive:\n✅ Pre-class reminders\n✅ Danger zone alerts\n✅ Daily briefs\n\nReply STOP anytime to unsubscribe.`
    );

    // Update user with WhatsApp number
    await prisma.user.update({
      where: { id: user.id },
      data: {
        whatsappNumber: phoneNumber,
        whatsappOptedIn: true,
      },
    });

    // Enable WhatsApp in notification settings
    await prisma.notificationSetting.update({
      where: { userId: user.id },
      data: { whatsappEnabled: true },
    });

    return NextResponse.json({ ok: true, message: "Verification sent! Check your WhatsApp." });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send WhatsApp message. Is the number on WhatsApp?" }, { status: 500 });
  }
}
