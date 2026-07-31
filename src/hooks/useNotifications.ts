"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";

export function useNotifications() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Request notification permission if not yet decided
    if ("Notification" in window && Notification.permission === "default") {
      // Don't request immediately — wait for user interaction or settings page
      // This just checks; actual request happens on settings page
    }

    // Register/update push subscription if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      registerPushSubscription();
    }

    // Auto-detect timezone and save if not set
    autoDetectTimezone();
  }, [session]);
}

async function registerPushSubscription() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.ready;
    const existingSub = await registration.pushManager.getSubscription();

    if (existingSub) {
      // Already subscribed — send to server to ensure it's current
      await savePushSubscription(existingSub);
      return;
    }

    // Create new subscription
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
    });

    await savePushSubscription(subscription);
  } catch (error) {
    console.error("[Push] Registration failed:", error);
  }
}

async function savePushSubscription(subscription: PushSubscription) {
  try {
    const subJSON = subscription.toJSON();
    await apiFetch("/push/subscribe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: subJSON.endpoint,
        keys: {
          p256dh: subJSON.keys?.p256dh,
          auth: subJSON.keys?.auth,
        }
      }),
    });
  } catch (error) {
    console.error("[Push] Failed to save subscription:", error);
  }
}

async function autoDetectTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      await apiFetch("/settings/timezone", {
        method: "PUT",
        body: JSON.stringify({ timezone: tz }),
      });
    }
  } catch {
    // Silent fail — timezone will use default
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
