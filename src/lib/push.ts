import webpush from "web-push";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "admin@attendease.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(subscription: PushSub, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) {
    console.log("[Push] VAPID not configured, skipping:", payload.title);
    return;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    console.log(`[Push] Sent: ${payload.title}`);
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log("[Push] Subscription expired, should remove:", subscription.endpoint);
      // Caller should handle removal
      throw err;
    }
    console.error("[Push] Send failed:", err);
    throw err;
  }
}
