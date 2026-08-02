"use client";
import { useEffect, useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import Link from "next/link";
import { ArrowLeft, Target, Save, Loader2 } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

function SettingsGoalSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-white/5" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-[#141425] rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-[#141425] rounded-md" />
        </div>
      </div>
      <div className="card-3d p-6 h-64 flex items-center justify-center">
        <FieldLoader size="lg" />
      </div>
    </div>
  );
}

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
    return <SettingsGoalSkeleton />;
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6">
      <Link href="/settings" className="btn-3d-secondary inline-flex items-center gap-2 transition" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-text tracking-tight">
          <div className="w-11 h-11 rounded-2xl bg-[#ff6b35] border-2 border-[#cc5529] flex items-center justify-center shadow-[0_3px_0_0_#cc5529]">
            <Target className="w-5 h-5 text-white" />
          </div>
          Goal Mode
        </h1>
        <p className="text-text-muted text-sm font-bold mt-1 ml-[56px]">
          Set a target attendance percentage and get daily action plans
        </p>
      </div>

      <StaggerGrid className="card-3d p-6 space-y-6 transition-all" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-text">Enable Goal Mode</p>
            <p className="text-xs text-text-muted font-bold mt-0.5">Show daily action plan on your dashboard</p>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`relative h-7 w-12 rounded-full border-2 transition-all duration-150 cursor-pointer ${
              enabled
                ? "bg-[#FF2D78] border-[#cc1a5e] shadow-[0_3px_0_0_#cc1a5e]"
                : "bg-gray-200 border-gray-300 shadow-[0_3px_0_0_#d1d5db] dark:bg-[#2a2a3d] dark:border-[#1a1a2e] dark:shadow-[0_3px_0_0_#0d0d1a]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full border-2 bg-white transition-all duration-150 ${
                enabled
                  ? "translate-x-5 border-white shadow-[0_2px_0_0_#cc1a5e]"
                  : "translate-x-0.5 border-gray-300 shadow-[0_2px_0_0_#d1d5db] dark:border-[#1a1a2e] dark:shadow-[0_2px_0_0_#0d0d1a]"
              }`}
            />
          </button>
        </div>

        {/* Target percentage */}
        {enabled && (
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-black text-text">
                  Target Attendance
                </label>
                <span className="text-[#ff6b35] text-2xl font-black tracking-tight">{targetPct}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={targetPct}
                onChange={(e) => setTargetPct(parseInt(e.target.value))}
                className="w-full accent-[#ff6b35] cursor-pointer h-3 border-2 border-gray-200 dark:border-[#2a2a3d] bg-gray-100 dark:bg-[#0d0d1a] rounded-full shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)]"
              />
              <div className="flex justify-between text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-1">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="p-4 bg-[#ff6b35]/10 rounded-2xl border-2 border-[#ff6b35]/30 shadow-[0_3px_0_0_rgba(255,107,53,0.2)]">
              <p className="text-sm text-text-secondary font-bold">
                {targetPct >= 90 ? (
                  <span>🎯 <strong className="text-[#ff6b35] font-black">Ambitious!</strong> Your dashboard will show which classes are mandatory to hit {targetPct}%.</span>
                ) : targetPct >= 75 ? (
                  <span>✅ <strong className="text-[#06d6a0] font-black">Solid target.</strong> You&apos;ll see a clear daily plan to maintain {targetPct}% across all subjects.</span>
                ) : (
                  <span>⚠️ <strong className="text-[#ef476f] font-black">Low target.</strong> Consider aiming higher — {targetPct}% may be close to minimum requirements.</span>
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
          className="btn-3d-primary w-full py-3 font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Goal Settings"}
        </button>
      </div>
    </PageTransition>
  );
}
