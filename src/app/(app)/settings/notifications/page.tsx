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
    return <FuturisticLoader variant="section" title="Loading notifications" icon="🔔" />;
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
          <Link href="/settings" className="btn-ghost p-2.5 rounded-xl">
            <ChevronLeft className="w-5 h-5 text-text" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-text">Notifications</h1>
            <p className="text-sm font-semibold text-text-secondary">Choose how AttendEase keeps you updated</p>
          </div>
        </div>

        {/* ===== GENERAL TIMING SETTINGS ===== */}
        <StaggerGrid className="space-y-3" delay={50} staggerDelay={80} animation="fadeSlideUp">
          {/* Timezone */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 border-2 border-border-heavy shadow-lg shadow-cyan-500/20">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-text text-sm">Timezone</p>
                  <p className="text-xs font-semibold text-text-muted">Set your local timezone</p>
                </div>
              </div>
              <select
                value={currentSettings.timezone || "Asia/Kolkata"}
                onChange={(e) => updateSetting({ timezone: e.target.value })}
                className="input-glass py-2 text-sm max-w-[160px]"
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
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shrink-0 border-2 border-border-heavy shadow-lg shadow-purple-500/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-text text-sm">Daily Brief Time</p>
                  <p className="text-xs font-semibold text-text-muted">Morning class schedule summary</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentSettings.dailyBriefHour}
                  onChange={(e) => updateSetting({ dailyBriefHour: parseInt(e.target.value) })}
                  className="input-glass py-2 text-sm w-16 text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="text-text-muted font-black">:</span>
                <select
                  value={currentSettings.dailyBriefMinute}
                  onChange={(e) => updateSetting({ dailyBriefMinute: parseInt(e.target.value) })}
                  className="input-glass py-2 text-sm w-16 text-center"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Daily Report Time */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 border-2 border-border-heavy shadow-lg shadow-amber-500/20">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-text text-sm">Daily Report Time</p>
                  <p className="text-xs font-semibold text-text-muted">End-of-day attendance summary</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentSettings.dailyReportHour}
                  onChange={(e) => updateSetting({ dailyReportHour: parseInt(e.target.value) })}
                  className="input-glass py-2 text-sm w-16 text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="text-text-muted font-black">:</span>
                <select
                  value={currentSettings.dailyReportMinute}
                  onChange={(e) => updateSetting({ dailyReportMinute: parseInt(e.target.value) })}
                  className="input-glass py-2 text-sm w-16 text-center"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pre-Class Reminder */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0 border-2 border-border-heavy shadow-lg shadow-pink-500/20">
                  <AlarmClock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-text text-sm">Pre-Class Alert</p>
                  <p className="text-xs font-semibold text-text-muted">How early to notify before class</p>
                </div>
              </div>
              <select
                value={currentSettings.preClassMinutes}
                onChange={(e) => updateSetting({ preClassMinutes: parseInt(e.target.value) })}
                className="input-glass py-2 text-sm max-w-[140px]"
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
          {CHANNELS.map((channel, channelIdx) => {
            const isChannelEnabled = currentSettings[channel.enabledKey];
            const isPush = channel.key === "push";

            return (
              <div
                key={channel.key}
                className="glass rounded-3xl overflow-hidden"
              >
                {/* Channel Header */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${channel.gradient} flex items-center justify-center shrink-0 border-2 border-border-heavy shadow-lg shadow-${channel.gradient.split(" ")[0].replace("from-", "")}/20`}>
                      <channel.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-text">{channel.label}</p>
                        {isPush && (
                          <StatusBadge status={pushStatus} />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-text-secondary">{channel.desc}</p>
                    </div>
                  </div>
                  <Toggle3D
                    enabled={isChannelEnabled}
                    onChange={() => updateSetting({ [channel.enabledKey]: !isChannelEnabled } as any)}
                  />
                </div>

                {/* Push-specific actions */}
                {isPush && (
                  <div className="px-5 pb-2">
                    {pushStatus === "disabled" && (
                      <button
                        onClick={enablePush}
                        disabled={isRegistering}
                        className="btn-gradient w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
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
                        className="btn-ghost w-full py-2.5 rounded-xl text-sm text-text-muted hover:text-danger transition"
                      >
                        Disable on this device
                      </button>
                    )}
                    {pushStatus === "denied" && (
                      <div className="glass-strong rounded-xl p-4 space-y-2">
                        <p className="text-sm font-bold text-danger">Notifications blocked by browser</p>
                        <ol className="text-xs font-semibold text-text-muted space-y-1 list-decimal list-inside">
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
                <div className={`divide-y-2 divide-border-heavy border-t-2 border-border-heavy transition-all duration-300 ${!isChannelEnabled ? "opacity-40 pointer-events-none" : ""}`}>
                  {NOTIFICATION_TYPES.map((type) => {
                    const settingKey = `${channel.key}${type.key}` as keyof NotificationSettings;
                    const isEnabled = currentSettings[settingKey] as boolean;

                    return (
                      <div
                        key={type.key}
                        className="flex items-center justify-between p-4 hover:bg-surface-3 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shrink-0 border-2 border-border-heavy`}>
                            <type.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text">{type.label}</p>
                            <p className="text-xs font-semibold text-text-muted">{type.desc}</p>
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
                  <div className="px-5 py-3 border-t-2 border-border-heavy">
                    <p className="text-xs font-semibold text-text-muted">
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
          <div className="glass-strong rounded-2xl p-4 shadow-2xl border-2 border-border-heavy">
            <div className="flex items-center justify-between gap-4">
              {/* Pulsing dot + label */}
              <div className="flex items-center gap-2 text-sm font-bold text-pink">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink" />
                </span>
                Unsaved changes
              </div>

              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className={`relative overflow-hidden rounded-full px-6 py-2.5 text-sm font-black text-white uppercase tracking-wide transition-all duration-300 border-2 border-border-heavy ${
                  saveStatus === "saving"
                    ? "bg-pink/50 cursor-wait"
                    : saveStatus === "saved"
                    ? "bg-success shadow-lg shadow-success/30 scale-95"
                    : saveStatus === "error"
                    ? "bg-danger shadow-lg shadow-danger/30"
                    : "bg-pink hover:bg-pink-dark shadow-[0px_6px_0px] shadow-border-heavy hover:translate-y-[2px] hover:shadow-[0px_4px_0px] active:translate-y-[6px] active:shadow-[0px_0px_0px]"
                }`}
              >
                {/* Shimmer effect */}
                {saveStatus === "saving" && (
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer-slide_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}

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
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-black text-success uppercase tracking-wide border border-success/30">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "denied") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-black text-danger uppercase tracking-wide border border-danger/30">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        Blocked
      </span>
    );
  }
  if (status === "loading") {
    return (
      <span className="text-[10px] font-black text-text-muted uppercase tracking-wide animate-pulse">
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
      className={`relative inline-flex ${h} items-center rounded-full border-2 border-border-heavy transition-all duration-300 shrink-0 ${
        enabled
          ? "bg-primary shadow-[0px_4px_0px] shadow-border-heavy"
          : "bg-surface-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
      }`}
    >
      <span
        className={`inline-block ${knob} transform rounded-full bg-white border border-border-heavy shadow-md transition-all duration-300 ${
          enabled ? translate : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

