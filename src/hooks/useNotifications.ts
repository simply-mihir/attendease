"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "./useApi";
import { useSession } from "next-auth/react";
import { useSWRFetch } from "./useSWRFetch";

export function useNotifications() {
  const { data: session } = useSession();
  const { data: settingsData } = useSWRFetch<any>("/notifications/settings");
  const settings = settingsData?.settings;

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

    if (Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted" && swRegistration) {
        await subscribePush(swRegistration);
      }
      return result === "granted";
    }
    return false;
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

  // Play alarm sound (with Web Audio fallback)
  function playAlarmSound(sound: string = "default") {
    if (sound === "silent") {
      if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
      return;
    }

    try {
      const audioFile = sound === "loud" ? "/sounds/alarm-loud.mp3" :
                        sound === "chime" ? "/sounds/alarm-chime.mp3" :
                        "/sounds/alarm-default.mp3";
      
      const audio = new Audio(audioFile);
      audio.volume = sound === "loud" ? 1 : 0.7;
      audio.play().catch(() => {
        // Fallback: generate alarm tone with Web Audio API
        try {
          const ctx = new window.AudioContext();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.frequency.value = 800;
          oscillator.type = "sine";
          gain.gain.value = 0.3;

          oscillator.start();
          // Beep pattern: on-off-on-off
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.4);
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.6);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.8);
          oscillator.stop(ctx.currentTime + 1);
        } catch {
          console.warn("[Alarm] Web Audio fallback also failed");
        }
      });
    } catch {
      console.warn("[Alarm] No audio support");
    }

    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  }

  // Robust Client-Side Pre-Class Reminders
  useEffect(() => {
    if (!session?.user) return;

    const timers: NodeJS.Timeout[] = [];

    async function scheduleReminders() {
      try {
        const data = await apiFetch("/schedules/today");
        const schedules = data?.schedules || data || [];

        if (!Array.isArray(schedules) || schedules.length === 0) return;

        const now = new Date();

        for (const schedule of schedules) {
          if (schedule.attendance?.status) continue;

          const [hours, minutes] = (schedule.startTime || "").split(":").map(Number);
          if (isNaN(hours) || isNaN(minutes)) continue;

          const classTime = new Date();
          classTime.setHours(hours, minutes, 0, 0);

          const reminderMinutes = settings?.alarmBeforeMinutes ?? 15;
          const reminderTime = new Date(classTime.getTime() - reminderMinutes * 60 * 1000);

          const msUntilReminder = reminderTime.getTime() - now.getTime();

          // Only schedule future reminders (skip past classes, max 12h)
          if (msUntilReminder > 0 && msUntilReminder < 12 * 60 * 60 * 1000) {
            const timer = setTimeout(() => {
              const subjectName = schedule.subject?.name || schedule.subjectName || "Class";

              // 1. Browser notification via Service Worker
              if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: "SHOW_NOTIFICATION",
                  title: `${subjectName} in ${reminderMinutes} min`,
                  options: {
                    body: `${schedule.startTime} - ${schedule.endTime}${schedule.room ? ` • ${schedule.room}` : ""}`,
                    icon: "/icons/icon-192.png",
                    badge: "/icons/icon-72.png",
                    tag: `pre-class-${schedule.id}`,
                    vibrate: [200, 100, 200],
                    data: {
                      scheduleId: schedule.id,
                      subjectId: schedule.subjectId || schedule.subject?.id,
                      subjectName,
                      userId: (session?.user as any)?.id,
                      url: "/dashboard",
                    },
                    actions: [
                      { action: "mark-present", title: "✓ Present" },
                      { action: "mark-absent", title: "✗ Absent" },
                    ],
                  },
                });
              } else if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`${subjectName} in ${reminderMinutes} min`, {
                  body: `${schedule.startTime} - ${schedule.endTime}`,
                  icon: "/icons/icon-192.png",
                  tag: `pre-class-${schedule.id}`,
                });
              }

              // 2. Play alarm sound if enabled
              if (settings?.alarmEnabled && settings?.alarmPreClass) {
                playAlarmSound(settings.alarmSound);
              }
            }, msUntilReminder);

            timers.push(timer);
          }

          // Also schedule alarm exactly at class start time
          const msUntilClass = classTime.getTime() - now.getTime();
          if (msUntilClass > 0 && msUntilClass < 12 * 60 * 60 * 1000 && settings?.alarmEnabled) {
            const alarmTimer = setTimeout(() => {
              playAlarmSound(settings.alarmSound);

              const subjectName = schedule.subject?.name || schedule.subjectName || "Class";
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`${subjectName} starting now!`, {
                  body: `${schedule.startTime} - ${schedule.endTime}`,
                  icon: "/icons/icon-192.png",
                  tag: `alarm-${schedule.id}`,
                });
              }
            }, msUntilClass);

            timers.push(alarmTimer);
          }
        }
      } catch (error) {
        console.error("[Notifications] Failed to schedule reminders:", error);
      }
    }

    scheduleReminders();

    // Reschedule every 30 minutes
    const refreshInterval = setInterval(scheduleReminders, 30 * 60 * 1000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(refreshInterval);
    };
  }, [session, settings]);

  return {
    permission,
    requestPermission,
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
