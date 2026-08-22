import { NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import webpush from "web-push";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "noreply@attendease.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const hasVapidPublic = !!process.env.VAPID_PUBLIC_KEY;
  const hasVapidPrivate = !!process.env.VAPID_PRIVATE_KEY;
  const hasClientVapid = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!hasVapidPublic || !hasVapidPrivate) {
    return NextResponse.json({
      error: "VAPID keys not configured on server",
      diagnostics: { hasVapidPublic, hasVapidPrivate, hasClientVapid },
    }, { status: 500 });
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
  });

  if (subs.length === 0) {
    return NextResponse.json({
      error: "No push subscriptions found for your account",
      diagnostics: { hasVapidPublic, hasVapidPrivate, hasClientVapid, subscriptionCount: 0 },
    }, { status: 404 });
  }

  const payload = JSON.stringify({
    title: "Push Test - AttendEase",
    body: "If you see this, push notifications are working!",
    tag: "push-test",
    vibrate: [200, 100, 200],
    data: { url: "/dashboard" },
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => ({
      statusCode: r.reason?.statusCode,
      message: r.reason?.body || r.reason?.message,
    }));

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      const code = (results[i] as PromiseRejectedResult).reason?.statusCode;
      if (code === 410 || code === 404) {
        await prisma.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    ok: sent > 0,
    sent,
    failed: errors.length,
    total: subs.length,
    errors: errors.length > 0 ? errors : undefined,
    diagnostics: { hasVapidPublic, hasVapidPrivate, hasClientVapid },
  });
}
