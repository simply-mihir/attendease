"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { status: pushStatus, isRegistering, enablePush, disablePush } = usePushNotifications();

  useEffect(() => {
    if (session?.user) {
      apiFetch("/settings/notifications")
        .then((data) => {
          setSettings(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  async function handleUpdate(updates: Partial<NotificationSettings>) {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setSaving(true);
    try {
      await apiFetch("/settings/notifications", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to save:", error);
      // Revert on error
      setSettings(settings);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-glass h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
        <p className="text-white/50 mt-4">Failed to load settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
        <p className="text-white/50 text-sm mt-1">
          {saving ? "Saving..." : "Configure when and how you get notified"}
        </p>
      </div>

      {/* ===== PUSH NOTIFICATIONS — THIS DEVICE ===== */}
      <div className="card-glass p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-white/50">For this device</p>
          </div>
          {pushStatus === "loading" && (
            <span className="text-xs text-white/40 animate-pulse">Checking...</span>
          )}
          {pushStatus === "enabled" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Active
            </span>
          )}
          {pushStatus === "disabled" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              Off
            </span>
          )}
          {pushStatus === "denied" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red-400 rounded-full" />
              Blocked
            </span>
          )}
          {pushStatus === "unsupported" && (
            <span className="text-xs text-white/30">Not supported</span>
          )}
        </div>

        {pushStatus === "disabled" && (
          <button
            onClick={enablePush}
            disabled={isRegistering}
            className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRegistering ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enabling...
              </>
            ) : (
              "🔔 Enable Push Notifications"
            )}
          </button>
        )}

        {pushStatus === "enabled" && (
          <button
            onClick={disablePush}
            className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-red-400/30 hover:bg-red-400/5 text-white/60 hover:text-red-400 text-sm font-medium transition-all duration-200"
          >
            Disable on this device
          </button>
        )}

        {pushStatus === "denied" && (
          <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
            <p className="text-sm text-red-300">Notifications are blocked by your browser.</p>
            <ol className="text-sm text-white/50 mt-2 space-y-1 list-decimal list-inside">
              <li>Open browser settings</li>
              <li>Find AttendEase in site permissions</li>
              <li>Change notifications to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}

        <p className="text-xs text-white/30">
          Works even when app is closed. Each device needs separate setup.
        </p>
      </div>

      {/* ===== TIMING SETTINGS ===== */}
      <div className="card-glass p-5 space-y-5">
        <h3 className="text-lg font-semibold text-white">Timing</h3>

        {/* Timezone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Timezone</label>
          <select
            value={settings.timezone || "Asia/Kolkata"}
            onChange={(e) => handleUpdate({ timezone: e.target.value } as any)}
            className="input-glass w-full"
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

        {/* Daily Brief Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">📚 Daily Brief Time</label>
          <p className="text-xs text-white/40">Morning class schedule summary</p>
          <div className="flex items-center gap-2">
            <select
              value={settings.dailyBriefHour}
              onChange={(e) => handleUpdate({ dailyBriefHour: parseInt(e.target.value) })}
              className="input-glass w-20"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-white/50">:</span>
            <select
              value={settings.dailyBriefMinute}
              onChange={(e) => handleUpdate({ dailyBriefMinute: parseInt(e.target.value) })}
              className="input-glass w-20"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Daily Report Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">📋 Daily Report Time</label>
          <p className="text-xs text-white/40">End-of-day attendance summary</p>
          <div className="flex items-center gap-2">
            <select
              value={settings.dailyReportHour}
              onChange={(e) => handleUpdate({ dailyReportHour: parseInt(e.target.value) })}
              className="input-glass w-20"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-white/50">:</span>
            <select
              value={settings.dailyReportMinute}
              onChange={(e) => handleUpdate({ dailyReportMinute: parseInt(e.target.value) })}
              className="input-glass w-20"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pre-Class Reminder */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">⏰ Pre-Class Reminder</label>
          <p className="text-xs text-white/40">Minutes before class starts</p>
          <select
            value={settings.preClassMinutes}
            onChange={(e) => handleUpdate({ preClassMinutes: parseInt(e.target.value) })}
            className="input-glass w-full max-w-[200px]"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
      </div>

      {/* ===== NOTIFICATION MATRIX ===== */}
      <div className="card-glass p-5 space-y-4 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white">Notification Types</h3>
        <p className="text-xs text-white/40">Select which types you want to receive on each channel.</p>

        <table className="w-full min-w-[500px] mt-4">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 font-medium text-white/50 text-sm">Type</th>
              <th className="text-center py-2 font-medium text-white/50 text-sm w-24">
                <div className="flex flex-col items-center gap-1">
                  Push
                  <Toggle
                    enabled={settings.pushEnabled}
                    onChange={() => handleUpdate({ pushEnabled: !settings.pushEnabled })}
                  />
                </div>
              </th>
              <th className="text-center py-2 font-medium text-white/50 text-sm w-24">
                <div className="flex flex-col items-center gap-1">
                  Email
                  <Toggle
                    enabled={settings.emailEnabled}
                    onChange={() => handleUpdate({ emailEnabled: !settings.emailEnabled })}
                  />
                </div>
              </th>
              <th className="text-center py-2 font-medium text-white/50 text-sm w-24">
                <div className="flex flex-col items-center gap-1">
                  Telegram
                  <Toggle
                    enabled={settings.telegramEnabled}
                    onChange={() => handleUpdate({ telegramEnabled: !settings.telegramEnabled })}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {/* Daily Brief */}
            <tr>
              <td className="py-4 text-white">
                <div className="font-medium">Daily Brief</div>
                <div className="text-xs text-white/40">Morning schedule</div>
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.pushDailyBrief}
                  disabled={!settings.pushEnabled}
                  onChange={(c) => handleUpdate({ pushDailyBrief: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.emailDailyBrief}
                  disabled={!settings.emailEnabled}
                  onChange={(c) => handleUpdate({ emailDailyBrief: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.telegramDailyBrief}
                  disabled={!settings.telegramEnabled}
                  onChange={(c) => handleUpdate({ telegramDailyBrief: c })}
                />
              </td>
            </tr>

            {/* Pre-Class */}
            <tr>
              <td className="py-4 text-white">
                <div className="font-medium">Pre-Class Reminders</div>
                <div className="text-xs text-white/40">Before class starts</div>
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.pushPreClass}
                  disabled={!settings.pushEnabled}
                  onChange={(c) => handleUpdate({ pushPreClass: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.emailPreClass}
                  disabled={!settings.emailEnabled}
                  onChange={(c) => handleUpdate({ emailPreClass: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.telegramPreClass}
                  disabled={!settings.telegramEnabled}
                  onChange={(c) => handleUpdate({ telegramPreClass: c })}
                />
              </td>
            </tr>

            {/* Daily Report */}
            <tr>
              <td className="py-4 text-white">
                <div className="font-medium">Daily Report</div>
                <div className="text-xs text-white/40">End-of-day summary</div>
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.pushDailyReport}
                  disabled={!settings.pushEnabled}
                  onChange={(c) => handleUpdate({ pushDailyReport: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.emailDailyReport}
                  disabled={!settings.emailEnabled}
                  onChange={(c) => handleUpdate({ emailDailyReport: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.telegramDailyReport}
                  disabled={!settings.telegramEnabled}
                  onChange={(c) => handleUpdate({ telegramDailyReport: c })}
                />
              </td>
            </tr>

            {/* Danger Zone */}
            <tr>
              <td className="py-4 text-white">
                <div className="font-medium text-red-400">Danger Zone Alerts</div>
                <div className="text-xs text-white/40">Low attendance warnings</div>
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.pushDangerAlert}
                  disabled={!settings.pushEnabled}
                  onChange={(c) => handleUpdate({ pushDangerAlert: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.emailDangerAlert}
                  disabled={!settings.emailEnabled}
                  onChange={(c) => handleUpdate({ emailDangerAlert: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.telegramDangerAlert}
                  disabled={!settings.telegramEnabled}
                  onChange={(c) => handleUpdate({ telegramDangerAlert: c })}
                />
              </td>
            </tr>

            {/* Weekly Report */}
            <tr>
              <td className="py-4 text-white">
                <div className="font-medium text-emerald-400">Weekly Report</div>
                <div className="text-xs text-white/40">Sunday performance recap</div>
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.pushWeeklyReport}
                  disabled={!settings.pushEnabled}
                  onChange={(c) => handleUpdate({ pushWeeklyReport: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.emailWeeklyReport}
                  disabled={!settings.emailEnabled}
                  onChange={(c) => handleUpdate({ emailWeeklyReport: c })}
                />
              </td>
              <td className="text-center">
                <Checkbox
                  checked={settings.telegramWeeklyReport}
                  disabled={!settings.telegramEnabled}
                  onChange={(c) => handleUpdate({ telegramWeeklyReport: c })}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-violet-600" : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Checkbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
        disabled
          ? "bg-white/5 cursor-not-allowed opacity-50 border border-white/5"
          : checked
          ? "bg-violet-600 text-white"
          : "bg-white/10 border border-white/20 hover:border-violet-500"
      }`}
    >
      {checked && (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
