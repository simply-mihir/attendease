"use client";
import { FuturisticLoader } from "@/components/FuturisticLoader";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Bell, Mail, Send, Clock, Globe, AlarmClock, BookOpen, AlertTriangle,
  BarChart3, CalendarCheck, ChevronLeft, Loader2, Check
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  pushDailyBrief: boolean;
  pushPreClass: boolean;
  pushDangerAlert: boolean;
  pushWeeklyReport: boolean;
  pushDailyReport: boolean;
  emailDailyBrief: boolean;
  emailPreClass: boolean;
  emailDangerAlert: boolean;
  emailWeeklyReport: boolean;
  emailDailyReport: boolean;
  telegramDailyBrief: boolean;
  telegramPreClass: boolean;
  telegramDangerAlert: boolean;
  telegramWeeklyReport: boolean;
  telegramDailyReport: boolean;
  dailyBriefHour: number;
  dailyBriefMinute: number;
  dailyReportHour: number;
  dailyReportMinute: number;
  preClassMinutes: number;
  timezone?: string;
}

// Notification type definitions for DRY rendering
const NOTIFICATION_TYPES = [
  { key: "DailyBrief", label: "Daily Brief", desc: "Morning summary of today's schedule", icon: BookOpen, gradient: "from-purple-500 to-violet-500" },
  { key: "PreClass", label: "Pre-Class Reminder", desc: "Alert before each class starts", icon: AlarmClock, gradient: "from-cyan-500 to-blue-500" },
  { key: "DangerAlert", label: "Danger Zone Alert", desc: "When attendance drops below minimum", icon: AlertTriangle, gradient: "from-red-500 to-orange-500" },
  { key: "WeeklyReport", label: "Weekly Report", desc: "Sunday performance recap", icon: BarChart3, gradient: "from-green-500 to-emerald-500" },
  { key: "DailyReport", label: "Daily Report", desc: "End-of-day attendance summary", icon: CalendarCheck, gradient: "from-amber-500 to-orange-500" },
] as const;

const CHANNELS = [
  { key: "push" as const, label: "Push Notifications", desc: "Browser & mobile alerts", icon: Bell, gradient: "from-purple-500 to-pink-500", enabledKey: "pushEnabled" as const },
  { key: "email" as const, label: "Email", desc: "Receive email digests", icon: Mail, gradient: "from-cyan-500 to-blue-500", enabledKey: "emailEnabled" as const },
  { key: "telegram" as const, label: "Telegram", desc: "Instant Telegram messages", icon: Send, gradient: "from-green-500 to-emerald-500", enabledKey: "telegramEnabled" as const },
] as const;

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const { status: pushStatus, isRegistering, enablePush, disablePush } = usePushNotifications();

  const { data: fetchedData, error, mutate } = useSWRFetch<NotificationSettings>(
    session?.user ? "/settings/notifications" : null
  );

  const [originalSettings, setOriginalSettings] = useState<NotificationSettings | null>(null);
  const [currentSettings, setCurrentSettings] = useState<NotificationSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loading = (!fetchedData && !error) || !currentSettings;

  useEffect(() => {
    if (fetchedData) {
      if (!originalSettings || JSON.stringify(originalSettings) === JSON.stringify(currentSettings)) {
        setOriginalSettings(structuredClone(fetchedData));
        setCurrentSettings(structuredClone(fetchedData));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedData]);

  const isDirty = originalSettings && currentSettings
    ? JSON.stringify(originalSettings) !== JSON.stringify(currentSettings)
    : false;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function updateSetting(updates: Partial<NotificationSettings>) {
    setCurrentSettings((prev) => prev ? { ...prev, ...updates } : null);
  }

  async function handleSave() {
    if (!isDirty || saveStatus === "saving" || !currentSettings) return;

    setSaveStatus("saving");

    try {
      await apiFetch("/settings/notifications", {
        method: "PUT",
        body: JSON.stringify(currentSettings),
      });

      setOriginalSettings(structuredClone(currentSettings));
      mutate(currentSettings, false);
      setSaveStatus("saved");

      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("[Settings] Save failed:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  if (loading) {
    return <FuturisticLoader variant="section" title="Loading notifications" Icon={Bell} />;
  }

  if (!currentSettings) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-black text-text">Notification Settings</h1>
        <div className="glass rounded-2xl p-6">
          <p className="text-text-muted font-semibold">Failed to load settings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
          <Link href="/settings" className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Notifications</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Choose how AttendEase keeps you updated</p>
          </div>
        </div>

        {/* ===== GENERAL TIMING SETTINGS ===== */}
        <StaggerGrid className="space-y-3" delay={50} staggerDelay={80} animation="fadeSlideUp">
          {/* Timezone */}
          <div className="rounded-2xl p-4 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Timezone</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Set your local timezone</p>
                </div>
              </div>
              <select
                value={currentSettings.timezone || "Asia/Kolkata"}
                onChange={(e) => updateSetting({ timezone: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white max-w-[160px] focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="America/New_York">US Eastern</option>
                <option value="America/Chicago">US Central</option>
                <option value="America/Denver">US Mountain</option>
                <option value="America/Los_Angeles">US Pacific</option>
                <option value="Europe/London">UK (GMT/BST)</option>
                <option value="Europe/Berlin">Central Europe</option>
                <option value="Asia/Dubai">Dubai (GST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Asia/Tokyo">Japan (JST)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
                <option value="Pacific/Auckland">New Zealand</option>
              </select>
            </div>
          </div>

          {/* Daily Brief Time */}
          <div className="rounded-2xl p-4 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Daily Brief Time</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Morning class schedule summary</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentSettings.dailyBriefHour}
                  onChange={(e) => updateSetting({ dailyBriefHour: parseInt(e.target.value) })}
                  className="px-2.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white w-16 text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
                <select
                  value={currentSettings.dailyBriefMinute}
                  onChange={(e) => updateSetting({ dailyBriefMinute: parseInt(e.target.value) })}
                  className="px-2.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white w-16 text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Daily Report Time */}
          <div className="rounded-2xl p-4 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Daily Report Time</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">End-of-day attendance summary</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentSettings.dailyReportHour}
                  onChange={(e) => updateSetting({ dailyReportHour: parseInt(e.target.value) })}
                  className="px-2.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white w-16 text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
                <select
                  value={currentSettings.dailyReportMinute}
                  onChange={(e) => updateSetting({ dailyReportMinute: parseInt(e.target.value) })}
                  className="px-2.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white w-16 text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pre-Class Reminder */}
          <div className="rounded-2xl p-4 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0 shadow-md shadow-pink-500/20">
                  <AlarmClock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Pre-Class Alert</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">How early to notify before class</p>
                </div>
              </div>
              <select
                value={currentSettings.preClassMinutes}
                onChange={(e) => updateSetting({ preClassMinutes: parseInt(e.target.value) })}
                className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white max-w-[140px] focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={5}>5 min before</option>
                <option value={10}>10 min before</option>
                <option value={15}>15 min before</option>
                <option value={30}>30 min before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>
          </div>
        </StaggerGrid>

        {/* ===== CHANNEL CARDS ===== */}
        <StaggerGrid className="space-y-6" delay={200} staggerDelay={80} animation="fadeSlideUp">
          {CHANNELS.map((channel) => {
            const isChannelEnabled = currentSettings[channel.enabledKey];
            const isPush = channel.key === "push";

            return (
              <div
                key={channel.key}
                className="rounded-3xl bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl overflow-hidden transition-all"
              >
                {/* Channel Header */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${channel.gradient} flex items-center justify-center shrink-0 shadow-md shadow-violet-500/10`}>
                      <channel.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 dark:text-white">{channel.label}</p>
                        {isPush && (
                          <StatusBadge status={pushStatus} />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{channel.desc}</p>
                    </div>
                  </div>
                  <Toggle3D
                    enabled={isChannelEnabled}
                    onChange={() => updateSetting({ [channel.enabledKey]: !isChannelEnabled } as any)}
                  />
                </div>

                {/* Push-specific actions */}
                {isPush && (
                  <div className="px-5 pb-3">
                    {pushStatus === "disabled" && (
                      <button
                        onClick={enablePush}
                        disabled={isRegistering}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold flex items-center justify-center gap-2 text-sm shadow-md shadow-violet-500/20 hover:shadow-lg transition cursor-pointer"
                      >
                        {isRegistering ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enabling...
                          </>
                        ) : (
                          <>
                            <Bell className="w-4 h-4" />
                            Enable Push on This Device
                          </>
                        )}
                      </button>
                    )}
                    {pushStatus === "enabled" && (
                      <button
                        onClick={disablePush}
                        className="w-full py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-rose-400 text-sm font-medium transition cursor-pointer"
                      >
                        Disable on this device
                      </button>
                    )}
                    {pushStatus === "denied" && (
                      <div className="rounded-xl p-4 space-y-2 bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Notifications blocked by browser</p>
                        <ol className="text-xs font-medium text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                          <li>Open browser settings</li>
                          <li>Find AttendEase in site permissions</li>
                          <li>Change notifications to &quot;Allow&quot;</li>
                          <li>Refresh this page</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Notification Type Cards */}
                <div className={`divide-y divide-gray-100 dark:divide-white/5 border-t border-gray-100 dark:border-white/5 transition-all duration-300 ${!isChannelEnabled ? "opacity-40 pointer-events-none" : ""}`}>
                  {NOTIFICATION_TYPES.map((type) => {
                    const settingKey = `${channel.key}${type.key}` as keyof NotificationSettings;
                    const isEnabled = currentSettings[settingKey] as boolean;

                    return (
                      <div
                        key={type.key}
                        className="flex items-center justify-between p-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                            <type.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{type.label}</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{type.desc}</p>
                          </div>
                        </div>
                        <Toggle3D
                          enabled={isEnabled}
                          onChange={() => updateSetting({ [settingKey]: !isEnabled } as any)}
                          small
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Footer hint for push */}
                {isPush && (
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-white/[0.02]">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Works even when app is closed. Each device needs separate setup.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </StaggerGrid>
      </PageTransition>

      {/* ===== STICKY SAVE FOOTER ===== */}
      <div
        className={`fixed bottom-0 left-0 lg:left-[280px] right-0 z-50 transition-all duration-500 ease-out ${
          isDirty
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-2xl px-4 pb-6 pt-3">
          <div className="rounded-2xl p-4 shadow-2xl bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between gap-4">
              {/* Pulsing dot + label */}
              <div className="flex items-center gap-2 text-sm font-bold text-pink-600 dark:text-pink-400">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500" />
                </span>
                Unsaved changes
              </div>

              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className={`relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 cursor-pointer ${
                  saveStatus === "saving"
                    ? "bg-pink-500/50 cursor-wait"
                    : saveStatus === "saved"
                    ? "bg-teal-600 shadow-lg shadow-teal-500/30 scale-95"
                    : saveStatus === "error"
                    ? "bg-rose-600 shadow-lg shadow-rose-500/30"
                    : "bg-gradient-to-r from-violet-600 to-pink-500 shadow-lg shadow-violet-500/25 hover:shadow-xl"
                }`}
              >
                <span className="relative flex items-center gap-2">
                  {saveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saveStatus === "saved" && <Check className="w-4 h-4" />}
                  {saveStatus === "idle" && "Save Settings"}
                  {saveStatus === "saving" && "Saving..."}
                  {saveStatus === "saved" && "Saved!"}
                  {saveStatus === "error" && "Retry"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== SUB-COMPONENTS ===== */

function StatusBadge({ status }: { status: string }) {
  if (status === "enabled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide border border-teal-200 dark:border-teal-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "denied") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide border border-rose-200 dark:border-rose-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Blocked
      </span>
    );
  }
  if (status === "loading") {
    return (
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide animate-pulse">
        Checking...
      </span>
    );
  }
  return null;
}

function Toggle3D({ enabled, onChange, small }: { enabled: boolean; onChange: () => void; small?: boolean }) {
  const h = small ? "h-6 w-11" : "h-7 w-13";
  const knob = small ? "h-4 w-4" : "h-5 w-5";
  const translate = small ? "translate-x-5" : "translate-x-6";

  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex ${h} items-center rounded-full transition-all duration-300 shrink-0 cursor-pointer ${
        enabled
          ? "bg-gradient-to-r from-violet-600 to-pink-500 shadow-md shadow-violet-500/25"
          : "bg-gray-200 dark:bg-white/10"
      }`}
    >
      <span
        className={`inline-block ${knob} transform rounded-full bg-white shadow-md transition-all duration-300 ${
          enabled ? translate : "translate-x-1"
        }`}
      />
    </button>
  );
}

