"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";

export function useAutoResubscribe() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    async function autoResubscribe() {
      // Guard 1: Check browser support
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

      // Guard 2: Only proceed if permission was already granted (don't prompt)
      if (Notification.permission !== "granted") return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        // Guard 3: Only call API if subscription actually exists with valid keys
        if (!subscription) return;

        const subJSON = subscription.toJSON();
        if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) return;

        await apiFetch("/push/subscribe", {
          method: "POST",
          body: JSON.stringify({
            endpoint: subJSON.endpoint,
            p256dh: subJSON.keys.p256dh,
            auth: subJSON.keys.auth,
          }),
        }).catch(() => {});
      } catch {
        // Silent fail — auto-resubscribe is best-effort
      }
    }

    // Delay to ensure SW is registered
    const timer = setTimeout(autoResubscribe, 2000);
    return () => clearTimeout(timer);
  }, [session]);
}
