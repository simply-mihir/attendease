import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { endpoint, keys } = await req.json();

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId: user.id,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId: user.id,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { endpoint } = await req.json();

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
