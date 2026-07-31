"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Bell, Send, Volume2, Mail, Moon, Loader2, Save, CheckCircle2, ExternalLink, RefreshCw
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={clsx("w-11 h-6 rounded-full transition relative",
      enabled ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"
    )}>
      <div className={clsx("w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-md",
        enabled ? "translate-x-5.5" : "translate-x-0.5"
      )} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Telegram status
  const [telegramStatus, setTelegramStatus] = useState<{ connected: boolean; username: string | null; connectUrl: string }>({
    connected: false,
    username: null,
    connectUrl: "",
  });
  const [checkingTelegram, setCheckingTelegram] = useState(false);

  const { data: settingsData, isLoading } = useSWRFetch<any>("/notifications/settings");

  useEffect(() => {
    if (settingsData && !settings) {
      setSettings(settingsData.settings);
    }
  }, [settingsData, settings]);

  useEffect(() => {
    if (settingsData?.settings && !settingsData.settings.timezone) {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      handleSaveAuto(detected);
    }
  }, [settingsData]);

  async function handleSaveAuto(timezone: string) {
    if (!settingsData?.settings) return;
    try {
      await apiFetch("/notifications/settings", {
        method: "PUT",
        body: JSON.stringify({ ...settingsData.settings, timezone }),
      });
      setSettings((prev: any) => ({ ...prev, timezone }));
    } catch (err) {}
  }

  const checkTelegramConnection = useCallback(async () => {
    setCheckingTelegram(true);
    try {
      const res = await apiFetch("/telegram/connect");
      setTelegramStatus(res);
    } catch (err) {
      console.error("Failed to fetch Telegram connection status:", err);
    } finally {
      setCheckingTelegram(false);
    }
  }, []);

  useEffect(() => {
    checkTelegramConnection();
  }, [checkTelegramConnection]);

  function update(key: string, value: unknown) {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/notifications/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <div className="text-center py-16 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/settings" className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <h1 className="text-2xl font-bold text-gradient">Notification Settings</h1>

      {/* Timezone Section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <Row label="Timezone" desc="Your local timezone for all notifications">
          <select
            value={settings.timezone || "Asia/Kolkata"}
            onChange={(e) => update("timezone", e.target.value)}
            className="input-glass w-full max-w-[250px]"
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
            <option value="Australia/Sydney">Sydney (AEST)</option>
            <option value="Pacific/Auckland">New Zealand</option>
          </select>
        </Row>
      </div>

      {/* Telegram Section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Telegram Bot</h2>
            <p className="text-xs text-gray-400">Receive free alerts directly on Telegram</p>
          </div>
        </div>

        <Row label="Enable Telegram" desc="Get reminders & daily briefs on Telegram">
          <Toggle enabled={settings.telegramEnabled} onChange={() => update("telegramEnabled", !settings.telegramEnabled)} />
        </Row>

        {settings.telegramEnabled && (
          <>
            {!telegramStatus.connected ? (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <p className="text-xs text-gray-400">
                  Connect your Telegram account to start receiving notifications.
                </p>
                <div className="flex gap-2">
                  <a
                    href={telegramStatus.connectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gradient-cyan px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Connect Telegram
                  </a>
                  <button
                    onClick={checkTelegramConnection}
                    disabled={checkingTelegram}
                    className="btn-ghost px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={clsx("w-3.5 h-3.5", checkingTelegram && "animate-spin")} />
                    Check Connection
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  Connected: {telegramStatus.username ? `@${telegramStatus.username}` : "Telegram Connected"}
                </span>
                <button onClick={checkTelegramConnection} className="ml-auto text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                  <RefreshCw className={clsx("w-3 h-3", checkingTelegram && "animate-spin")} /> Re-check
                </button>
              </div>
            )}

            <Row label="Pre-class reminder" desc="Reminder before each class">
              <Toggle enabled={settings.telegramPreClass} onChange={() => update("telegramPreClass", !settings.telegramPreClass)} />
            </Row>
            <Row label="Reminder timing">
              <select value={settings.telegramBeforeMinutes} onChange={(e) => update("telegramBeforeMinutes", parseInt(e.target.value))}
                className="input-glass px-3 py-1.5 rounded-xl text-sm">
                {[5, 10, 15, 30, 60].map((m) => <option key={m} value={m}>{m} min before</option>)}
              </select>
            </Row>
            <Row label="Danger zone alerts" desc="When attendance nears minimum">
              <Toggle enabled={settings.telegramDangerAlert} onChange={() => update("telegramDangerAlert", !settings.telegramDangerAlert)} />
            </Row>
            <Row label="Daily morning brief" desc="Summary of today's classes">
              <Toggle enabled={settings.telegramDailyBrief} onChange={() => update("telegramDailyBrief", !settings.telegramDailyBrief)} />
            </Row>
            <Row label="Weekly report" desc="Sunday attendance overview">
              <Toggle enabled={settings.telegramWeeklyReport} onChange={() => update("telegramWeeklyReport", !settings.telegramWeeklyReport)} />
            </Row>
          </>
        )}
      </div>

      {/* Email Section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Email Notifications</h2>
            <p className="text-xs text-gray-400">Receive reports and alerts in your inbox via Resend</p>
          </div>
        </div>

        <Row label="Enable Email Notifications" desc="Get briefs and alerts sent to your email">
          <Toggle enabled={settings.emailEnabled} onChange={() => update("emailEnabled", !settings.emailEnabled)} />
        </Row>

        {settings.emailEnabled && (
          <>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">
                Delivery Address: {session?.user?.email || "Your Account Email"}
              </span>
            </div>

            <Row label="Pre-class reminder" desc="Reminder email before each class">
              <Toggle enabled={settings.emailPreClass} onChange={() => update("emailPreClass", !settings.emailPreClass)} />
            </Row>
            <Row label="Danger zone alerts" desc="Warning email when attendance drops">
              <Toggle enabled={settings.emailDangerAlert} onChange={() => update("emailDangerAlert", !settings.emailDangerAlert)} />
            </Row>
            <Row label="Daily morning brief" desc="Schedule overview email">
              <Toggle enabled={settings.emailDailyBrief} onChange={() => update("emailDailyBrief", !settings.emailDailyBrief)} />
            </Row>
            <Row label="Weekly report" desc="Sunday weekly summary email">
              <Toggle enabled={settings.emailWeeklyReport} onChange={() => update("emailWeeklyReport", !settings.emailWeeklyReport)} />
            </Row>
          </>
        )}
      </div>

      {/* Alarm Section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">Alarm & Push</h2>
        </div>
        <Row label="Enable alarms">
          <Toggle enabled={settings.alarmEnabled} onChange={() => update("alarmEnabled", !settings.alarmEnabled)} />
        </Row>
        {settings.alarmEnabled && (
          <>
            <Row label="Pre-class alarm">
              <Toggle enabled={settings.alarmPreClass} onChange={() => update("alarmPreClass", !settings.alarmPreClass)} />
            </Row>
            <Row label="Alarm timing">
              <select value={settings.alarmBeforeMinutes} onChange={(e) => update("alarmBeforeMinutes", parseInt(e.target.value))}
                className="input-glass px-3 py-1.5 rounded-xl text-sm">
                {[5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} min before</option>)}
              </select>
            </Row>
            <Row label="Danger threshold" desc="Alert when within X% of minimum">
              <select value={settings.alarmDangerThreshold} onChange={(e) => update("alarmDangerThreshold", parseFloat(e.target.value))}
                className="input-glass px-3 py-1.5 rounded-xl text-sm">
                {[3, 5, 10].map((m) => <option key={m} value={m}>{m}%</option>)}
              </select>
            </Row>
            <Row label="Sound">
              <select value={settings.alarmSound} onChange={(e) => update("alarmSound", e.target.value)}
                className="input-glass px-3 py-1.5 rounded-xl text-sm">
                {["default", "loud", "chime", "vibrate", "silent"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Row>
          </>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">Quiet Hours</h2>
        </div>
        <Row label="Enable quiet hours" desc="No notifications during these hours">
          <Toggle enabled={settings.quietHoursEnabled} onChange={() => update("quietHoursEnabled", !settings.quietHoursEnabled)} />
        </Row>
        {settings.quietHoursEnabled && (
          <div className="flex gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
              <input type="time" value={settings.quietHoursStart} onChange={(e) => update("quietHoursStart", e.target.value)}
                className="input-glass px-3 py-2 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Until</label>
              <input type="time" value={settings.quietHoursEnd} onChange={(e) => update("quietHoursEnd", e.target.value)}
                className="input-glass px-3 py-2 rounded-xl text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Daily brief time */}
      <div className="glass rounded-2xl p-6">
        <Row label="Daily brief time" desc="When to receive your morning brief">
          <div className="flex items-center gap-2">
            <select
              value={settings.dailyBriefHour ?? 7}
              onChange={(e) => update("dailyBriefHour", parseInt(e.target.value))}
              className="input-glass w-20 text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-white/50">:</span>
            <select
              value={settings.dailyBriefMinute ?? 0}
              onChange={(e) => update("dailyBriefMinute", parseInt(e.target.value))}
              className="input-glass w-20 text-sm"
            >
              <option value={0}>00</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
            </select>
          </div>
        </Row>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="btn-gradient w-full py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
