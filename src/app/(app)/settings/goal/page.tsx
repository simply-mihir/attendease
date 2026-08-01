"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import Link from "next/link";
import { ArrowLeft, Target, Save, Loader2 } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

export default function GoalSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [targetPct, setTargetPct] = useState(85);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading: loading } = useSWRFetch<any>("/notifications/settings");

  useEffect(() => {
    if (data?.settings) {
      setEnabled(data.settings.goalModeEnabled ?? false);
      setTargetPct(data.settings.goalTargetPct ?? 85);
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/notifications/settings", {
        method: "PUT",
        body: JSON.stringify({
          goalModeEnabled: enabled,
          goalTargetPct: targetPct,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="h-8 w-48 rounded-xl bg-white/10 animate-pulse" />
        <div className="glass rounded-2xl p-6 h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6">
      <Link href="/settings" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">Goal Mode</span>
        </h1>
        <p className="text-text-muted text-sm mt-1 ml-[52px]">
          Set a target attendance percentage and get daily action plans
        </p>
      </div>

      <StaggerGrid className="glass rounded-2xl p-6 space-y-6" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-text">Enable Goal Mode</p>
            <p className="text-xs text-text-muted">Show daily action plan on your dashboard</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={clsx(
              "w-14 h-7 rounded-full transition relative border-2 border-border-heavy",
              enabled ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-surface-3"
            )}
          >
            <div
              className={clsx(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-md",
                enabled ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Target percentage */}
        {enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-text mb-2">
                Target Attendance: <span className="text-amber-400 text-xl">{targetPct}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={100}
                value={targetPct}
                onChange={(e) => setTargetPct(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="p-4 bg-surface-3 rounded-xl border-2 border-border-heavy">
              <p className="text-sm text-text-secondary">
                {targetPct >= 90 ? (
                  <span>🎯 <span className="font-bold text-amber-400">Ambitious!</span> Your dashboard will show which classes are mandatory to hit {targetPct}%.</span>
                ) : targetPct >= 75 ? (
                  <span>✅ <span className="font-bold text-green-400">Solid target.</span> You&apos;ll see a clear daily plan to maintain {targetPct}% across all subjects.</span>
                ) : (
                  <span>⚠️ <span className="font-bold text-yellow-400">Low target.</span> Consider aiming higher — {targetPct}% may be close to minimum requirements.</span>
                )}
              </p>
            </div>
          </div>
        )}
      </StaggerGrid>

      {/* Save button */}
      <div style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 300ms forwards" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Goal Settings"}
        </button>
      </div>
    </PageTransition>
  );
}
