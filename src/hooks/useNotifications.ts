"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "./useApi";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        setSwRegistration(reg);
        console.log("[SW] Registered");
      });
    }
  }, []);

  async function requestPermission() {
    if (!("Notification" in window)) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted" && swRegistration) {
      await subscribePush(swRegistration);
    }

    return result === "granted";
  }

  async function subscribePush(reg: ServiceWorkerRegistration) {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.log("[Push] No VAPID key configured");
      return;
    }

    try {
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });

      const json = subscription.toJSON();
      await apiFetch("/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      console.log("[Push] Subscribed");
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
    }
  }

  function scheduleAlarm(title: string, body: string, delayMs: number, sound: string = "default", data: any = {}) {
    if (!swRegistration) return;

    swRegistration.active?.postMessage({
      type: "SCHEDULE_ALARM",
      title,
      body,
      delay: delayMs,
      sound,
      data,
    });
  }

  // Play alarm sound
  function playAlarmSound(sound: string = "default") {
    const audioFile = sound === "loud" ? "/sounds/alarm-loud.mp3" :
                      sound === "chime" ? "/sounds/alarm-chime.mp3" :
                      "/sounds/alarm-default.mp3";
    const audio = new Audio(audioFile);
    audio.volume = sound === "silent" ? 0 : sound === "loud" ? 1 : 0.7;
    audio.play().catch(() => {});

    // Vibrate if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  }

  return {
    permission,
    requestPermission,
    scheduleAlarm,
    playAlarmSound,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
