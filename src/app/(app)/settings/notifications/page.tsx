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
        <h1 className="text-2xl font-black text-[#1a1a2e] dark:text-white">Notification Settings</h1>
        <div className="card-3d p-6">
          <p className="text-[#9ca3af] dark:text-[#6b6b80] font-bold">Failed to load settings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
          <Link href="/settings" className="p-3 rounded-xl border-2 border-transparent hover:bg-gray-200/60 dark:hover:bg-white/[0.04] text-[#4a4a5a] dark:text-[#6b6b80] hover:text-[#1a1a2e] dark:hover:text-white transition cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a2e] dark:text-white tracking-tight">Notifications</h1>
            <p className="text-sm font-bold text-[#4a4a5a] dark:text-[#6b6b80] mt-0.5">Choose how AttendEase keeps you updated</p>
          </div>
        </div>

        {/* ===== GENERAL TIMING SETTINGS ===== */}
        <StaggerGrid className="space-y-4" delay={50} staggerDelay={80} animation="fadeSlideUp">
          {/* Timezone */}
          <div className="card-3d p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#4cc9f0] border-2 border-[#3aa3c4] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#3aa3c4]">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-[#1a1a2e] dark:text-white text-sm">Timezone</p>
                  <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">Set your local timezone</p>
                </div>
              </div>
              <select
                value={currentSettings.timezone || "Asia/Kolkata"}
                onChange={(e) => updateSetting({ timezone: e.target.value })}
                className="input-3d px-3 py-2 text-sm max-w-[160px]"
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
          <div className="card-3d p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#9b5de5] border-2 border-[#7c4ab8] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#7c4ab8]">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-[#1a1a2e] dark:text-white text-sm">Daily Brief Time</p>
                  <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">Morning class schedule summary</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentSettings.dailyBriefHour}
                  onChange={(e) => updateSetting({ dailyBriefHour: parseInt(e.target.value) })}
                  className="input-3d px-2.5 py-2 text-sm w-16 text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="text-[#9ca3af] dark:text-[#6b6b80] font-black">:</span>
                <select
                  value={currentSettings.dailyBriefMinute}
                  onChange={(e) => updateSetting({ dailyBriefMinute: parseInt(e.target.value) })}
                  className="input-3d px-2.5 py-2 text-sm w-16 text-center"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Daily Report Time */}
          <div className="card-3d p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#ff6b35] border-2 border-[#cc5529] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#cc5529]">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-[#1a1a2e] dark:text-white text-sm">Daily Report Time</p>
                  <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">End-of-day attendance summary</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentSettings.dailyReportHour}
                  onChange={(e) => updateSetting({ dailyReportHour: parseInt(e.target.value) })}
                  className="input-3d px-2.5 py-2 text-sm w-16 text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="text-[#9ca3af] dark:text-[#6b6b80] font-black">:</span>
                <select
                  value={currentSettings.dailyReportMinute}
                  onChange={(e) => updateSetting({ dailyReportMinute: parseInt(e.target.value) })}
                  className="input-3d px-2.5 py-2 text-sm w-16 text-center"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pre-Class Reminder */}
          <div className="card-3d p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#cc1a5e]">
                  <AlarmClock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-[#1a1a2e] dark:text-white text-sm">Pre-Class Alert</p>
                  <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">How early to notify before class</p>
                </div>
              </div>
              <select
                value={currentSettings.preClassMinutes}
                onChange={(e) => updateSetting({ preClassMinutes: parseInt(e.target.value) })}
                className="input-3d px-3 py-2 text-sm max-w-[140px]"
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
                className="card-3d overflow-hidden p-0 transition-all"
              >
                {/* Channel Header */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${channel.gradient} flex items-center justify-center shrink-0 shadow-[0_3px_0_0_rgba(0,0,0,0.1)] border-2 border-white/20`}>
                      <channel.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-[#1a1a2e] dark:text-white">{channel.label}</p>
                        {isPush && (
                          <StatusBadge status={pushStatus} />
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80] mt-0.5">{channel.desc}</p>
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
                        className="btn-3d-primary w-full py-3 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
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
                        className="btn-3d-secondary w-full py-2.5 text-sm cursor-pointer text-[#ef476f] hover:text-[#c43559] border-[#ef476f]/20 hover:border-[#ef476f]/40 hover:bg-[#ef476f]/5"
                      >
                        Disable on this device
                      </button>
                    )}
                    {pushStatus === "denied" && (
                      <div className="rounded-xl p-4 space-y-2 bg-[#ef476f]/10 border-2 border-[#ef476f]/20 shadow-[0_3px_0_0_rgba(239,71,111,0.2)]">
                        <p className="text-sm font-black text-[#ef476f]">Notifications blocked by browser</p>
                        <ol className="text-xs font-bold text-[#4a4a5a] dark:text-[#c4c4d4] space-y-1 list-decimal list-inside">
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
                <div className={`divide-y divide-gray-200 dark:divide-[#2a2a3d] border-t-2 border-gray-200 dark:border-[#2a2a3d] transition-all duration-300 ${!isChannelEnabled ? "opacity-40 pointer-events-none" : ""}`}>
                  {NOTIFICATION_TYPES.map((type) => {
                    const settingKey = `${channel.key}${type.key}` as keyof NotificationSettings;
                    const isEnabled = currentSettings[settingKey] as boolean;

                    return (
                      <div
                        key={type.key}
                        className="flex items-center justify-between p-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shrink-0 shadow-[0_2px_0_0_rgba(0,0,0,0.1)] border-2 border-white/20`}>
                            <type.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#1a1a2e] dark:text-white">{type.label}</p>
                            <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">{type.desc}</p>
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
                  <div className="px-5 py-3 border-t-2 border-gray-200 dark:border-[#2a2a3d] bg-gray-50 dark:bg-[#070b14]">
                    <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">
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
          <div className="card-3d p-4 bg-white/95 dark:bg-[#141425]/95 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              {/* Pulsing dot + label */}
              <div className="flex items-center gap-2 text-sm font-black text-[#FF2D78]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF2D78] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF2D78]" />
                </span>
                Unsaved changes
              </div>

              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className={`relative overflow-hidden rounded-xl border-2 px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 cursor-pointer ${
                  saveStatus === "saving"
                    ? "bg-[#FF2D78]/50 border-[#cc1a5e]/50 shadow-[0_3px_0_0_rgba(204,26,94,0.5)] cursor-wait"
                    : saveStatus === "saved"
                    ? "bg-[#06d6a0] border-[#05a87e] shadow-[0_3px_0_0_#05a87e]"
                    : saveStatus === "error"
                    ? "bg-[#ef476f] border-[#c43559] shadow-[0_3px_0_0_#c43559]"
                    : "bg-[#FF2D78] border-[#cc1a5e] shadow-[0_4px_0_0_#cc1a5e] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#cc1a5e] active:translate-y-[3px] active:shadow-[0_1px_0_0_#cc1a5e]"
                }`}
              >
                <span className="relative flex items-center gap-2 font-black">
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
      <span className="inline-flex items-center gap-1 rounded-full bg-[#06d6a0]/10 px-2 py-0.5 text-[10px] font-black text-[#06d6a0] uppercase tracking-wide border-2 border-[#06d6a0]/30 shadow-[0_2px_0_0_rgba(6,214,160,0.2)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#06d6a0] animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "denied") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#ef476f]/10 px-2 py-0.5 text-[10px] font-black text-[#ef476f] uppercase tracking-wide border-2 border-[#ef476f]/30 shadow-[0_2px_0_0_rgba(239,71,111,0.2)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ef476f]" />
        Blocked
      </span>
    );
  }
  if (status === "loading") {
    return (
      <span className="text-[10px] font-black text-[#9ca3af] dark:text-[#6b6b80] uppercase tracking-wide animate-pulse">
        Checking...
      </span>
    );
  }
  return null;
}

function Toggle3D({ enabled, onChange, small }: { enabled: boolean; onChange: () => void; small?: boolean }) {
  const h = small ? "h-6 w-11" : "h-7 w-12";
  const knob = small ? "h-4 w-4" : "h-5 w-5";
  const translate = small ? "translate-x-5" : "translate-x-5";

  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex ${h} items-center rounded-full border-2 transition-all duration-150 shrink-0 cursor-pointer ${
        enabled
          ? "bg-[#FF2D78] border-[#cc1a5e] shadow-[0_3px_0_0_#cc1a5e]"
          : "bg-gray-200 border-gray-300 shadow-[0_3px_0_0_#d1d5db] dark:bg-[#2a2a3d] dark:border-[#1a1a2e] dark:shadow-[0_3px_0_0_#0d0d1a]"
      }`}
    >
      <span
        className={`absolute top-0.5 ${knob} rounded-full border-2 bg-white transition-all duration-150 ${
          enabled
            ? `${translate} border-white shadow-[0_2px_0_0_#cc1a5e]`
            : "translate-x-0.5 border-gray-300 shadow-[0_2px_0_0_#d1d5db] dark:border-[#1a1a2e] dark:shadow-[0_2px_0_0_#0d0d1a]"
        }`}
      />
    </button>
  );
}

