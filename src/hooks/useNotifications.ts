"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";

export function useAutoResubscribe() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    async function autoResubscribe() {
      // Only auto-resubscribe if permission is already granted
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Subscription exists — silently ensure server knows about it
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
          }).catch(() => {}); // Silent fail
        }
        // If no subscription but permission granted, user probably disabled manually — don't re-enable
      } catch {
        // Silent fail
      }
    }

    // Delay to ensure SW is registered
    const timer = setTimeout(autoResubscribe, 2000);
    return () => clearTimeout(timer);
  }, [session]);
}
