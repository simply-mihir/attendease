"use client";
import { useEffect, useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
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
    return <FuturisticLoader variant="section" title="Loading goal" Icon={Target} />;
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm font-medium transition" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          Goal Mode
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
          Set a target attendance percentage and get daily action plans
        </p>
      </div>

      <StaggerGrid className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-6 transition-all" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Enable Goal Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Show daily action plan on your dashboard</p>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={clsx(
              "w-12 h-7 rounded-full transition-all relative cursor-pointer",
              enabled ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20" : "bg-gray-200 dark:bg-white/10"
            )}
          >
            <div
              className={clsx(
                "w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm",
                enabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Target percentage */}
        {enabled && (
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                  Target Attendance
                </label>
                <span className="text-amber-600 dark:text-amber-400 text-2xl font-extrabold tracking-tight">{targetPct}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={targetPct}
                onChange={(e) => setTargetPct(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-gray-200 dark:bg-white/10 rounded-lg"
              />
              <div className="flex justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-500/10 rounded-2xl border border-amber-200/80 dark:border-amber-500/20">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {targetPct >= 90 ? (
                  <span>🎯 <strong className="text-amber-600 dark:text-amber-400 font-bold">Ambitious!</strong> Your dashboard will show which classes are mandatory to hit {targetPct}%.</span>
                ) : targetPct >= 75 ? (
                  <span>✅ <strong className="text-teal-600 dark:text-teal-400 font-bold">Solid target.</strong> You&apos;ll see a clear daily plan to maintain {targetPct}% across all subjects.</span>
                ) : (
                  <span>⚠️ <strong className="text-rose-600 dark:text-rose-400 font-bold">Low target.</strong> Consider aiming higher — {targetPct}% may be close to minimum requirements.</span>
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
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Goal Settings"}
        </button>
      </div>
    </PageTransition>
  );
}
