"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { ArrowLeft, Bell, MessageSquare, Volume2, Mail, Moon, Loader2, Save } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={clsx("w-11 h-6 rounded-full transition relative",
      enabled ? "bg-primary" : "bg-surface-3"
    )}>
      <div className={clsx("w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
        enabled ? "translate-x-5.5" : "translate-x-0.5"
      )} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/notifications/settings").then((d) => setSettings(d.settings)).catch(console.error);
  }, []);

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
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  if (!settings) return <div className="text-center py-16 text-text-muted">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/settings" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <h1 className="text-2xl font-bold">Notification Settings</h1>

      {/* WhatsApp Section */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-success" />
          <h2 className="text-lg font-semibold">WhatsApp Reminders</h2>
        </div>
        <Row label="Enable WhatsApp" desc="Get reminders on WhatsApp">
          <Toggle enabled={settings.whatsappEnabled} onChange={() => update("whatsappEnabled", !settings.whatsappEnabled)} />
        </Row>
        {settings.whatsappEnabled && (
          <>
            <Row label="Pre-class reminder" desc="Reminder before each class">
              <Toggle enabled={settings.whatsappPreClass} onChange={() => update("whatsappPreClass", !settings.whatsappPreClass)} />
            </Row>
            <Row label="Reminder timing">
              <select value={settings.whatsappBeforeMinutes} onChange={(e) => update("whatsappBeforeMinutes", parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-sm">
                {[5, 10, 15, 30, 60].map((m) => <option key={m} value={m}>{m} min before</option>)}
              </select>
            </Row>
            <Row label="Danger zone alerts" desc="When attendance nears minimum">
              <Toggle enabled={settings.whatsappDangerAlert} onChange={() => update("whatsappDangerAlert", !settings.whatsappDangerAlert)} />
            </Row>
            <Row label="Daily morning brief" desc="Summary of today's classes">
              <Toggle enabled={settings.whatsappDailyBrief} onChange={() => update("whatsappDailyBrief", !settings.whatsappDailyBrief)} />
            </Row>
            <Row label="Weekly report">
              <Toggle enabled={settings.whatsappWeeklyReport} onChange={() => update("whatsappWeeklyReport", !settings.whatsappWeeklyReport)} />
            </Row>
          </>
        )}
      </div>

      {/* Alarm Section */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Alarm & Push</h2>
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
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-sm">
                {[5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} min before</option>)}
              </select>
            </Row>
            <Row label="Danger threshold" desc="Alert when within X% of minimum">
              <select value={settings.alarmDangerThreshold} onChange={(e) => update("alarmDangerThreshold", parseFloat(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-sm">
                {[3, 5, 10].map((m) => <option key={m} value={m}>{m}%</option>)}
              </select>
            </Row>
            <Row label="Sound">
              <select value={settings.alarmSound} onChange={(e) => update("alarmSound", e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-sm">
                {["default", "loud", "chime", "vibrate", "silent"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Row>
          </>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Moon className="w-5 h-5 text-primary-light" />
          <h2 className="text-lg font-semibold">Quiet Hours</h2>
        </div>
        <Row label="Enable quiet hours" desc="No notifications during these hours">
          <Toggle enabled={settings.quietHoursEnabled} onChange={() => update("quietHoursEnabled", !settings.quietHoursEnabled)} />
        </Row>
        {settings.quietHoursEnabled && (
          <div className="flex gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">From</label>
              <input type="time" value={settings.quietHoursStart} onChange={(e) => update("quietHoursStart", e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Until</label>
              <input type="time" value={settings.quietHoursEnd} onChange={(e) => update("quietHoursEnd", e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Daily brief time */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <Row label="Daily brief time" desc="When to receive your morning brief">
          <input type="time" value={settings.dailyBriefTime} onChange={(e) => update("dailyBriefTime", e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm" />
        </Row>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
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
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-text-muted">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
