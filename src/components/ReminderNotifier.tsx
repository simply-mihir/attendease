"use client";

import { useEffect, useRef } from "react";
import { useSWRFetch } from "@/hooks/useSWRFetch";

interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string | null;
  notifyPush: boolean;
  notifyAlarm: boolean;
  isCompleted: boolean;
}

export function ReminderNotifier() {
  const { data } = useSWRFetch<{ reminders: Reminder[] }>("/reminders?completed=false");
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request Notification permission if push or alarm is enabled
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!data?.reminders) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toTimeString().slice(0, 5);

    data.reminders.forEach((r) => {
      if (r.isCompleted) return;

      const rDate = new Date(r.dueDate).toISOString().slice(0, 10);
      const isDueToday = rDate === todayStr;

      if (isDueToday && !alertedRef.current.has(r.id)) {
        // 1. Browser Push Notification
        if (r.notifyPush && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(`🔔 AttendEase Reminder: ${r.title}`, {
              body: `Due today${r.dueTime ? ` at ${r.dueTime}` : ""}. Stay on track!`,
              icon: "/icons/icon-192.png",
            });
          } catch (e) {
            console.error("Browser notification failed:", e);
          }
        }

        // 2. Alarm Sound via Web Audio API Oscillator
        if (r.notifyAlarm && typeof window !== "undefined") {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note chime
              gain.gain.setValueAtTime(0.15, ctx.currentTime);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.6);
            }
          } catch (e) {
            console.error("Audio alarm playback error:", e);
          }
        }

        alertedRef.current.add(r.id);
      }
    });
  }, [data]);

  return null;
}
