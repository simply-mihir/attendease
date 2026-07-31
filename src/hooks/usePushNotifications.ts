"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";

type PushStatus = "loading" | "unsupported" | "denied" | "enabled" | "disabled";

export function usePushNotifications() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isRegistering, setIsRegistering] = useState(false);

  // Check current push state
  const checkStatus = useCallback(async () => {
    // Not supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    // Permission denied permanently
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    // Permission granted — check if subscription exists
    if (Notification.permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setStatus(subscription ? "enabled" : "disabled");
      } catch {
        setStatus("disabled");
      }
      return;
    }

    // Permission not yet asked (default)
    setStatus("disabled");
  }, []);

  useEffect(() => {
    if (session?.user) {
      // Small delay to let SW register first
      const timer = setTimeout(checkStatus, 1000);
      return () => clearTimeout(timer);
    }
  }, [session, checkStatus]);

  // Enable push notifications
  const enablePush = useCallback(async (): Promise<boolean> => {
    if (!session?.user) return false;
    setIsRegistering(true);

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setIsRegistering(false);
        return false;
      }

      // 2. Wait for SW to be ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
        setIsRegistering(false);
        return false;
      }

      // Unsubscribe old subscription if exists
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });

      // 4. Save to server
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

      setStatus("enabled");
      setIsRegistering(false);
      return true;
    } catch (error) {
      console.error("[Push] Enable failed:", error);
      setIsRegistering(false);
      await checkStatus(); // Re-check actual state
      return false;
    }
  }, [session, checkStatus]);

  // Disable push notifications
  const disablePush = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from server
        await apiFetch("/push/unsubscribe", {
          method: "POST",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {}); // Silent fail on server removal

        // Unsubscribe locally
        await subscription.unsubscribe();
      }

      setStatus("disabled");
      return true;
    } catch (error) {
      console.error("[Push] Disable failed:", error);
      return false;
    }
  }, []);

  return {
    status,
    isRegistering,
    enablePush,
    disablePush,
    checkStatus,
  };
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
