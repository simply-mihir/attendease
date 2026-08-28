"use client";
import { useEffect, useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import Link from "next/link";
import { ArrowLeft, Target, Save, Loader2, ListChecks, CheckCircle2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";
import { invalidate, invalidatePrefix } from "@/hooks/useSWRFetch";


export default function GoalSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [goalType, setGoalType] = useState<"overall" | "subject">("overall");
  const [targetPct, setTargetPct] = useState(85);
  const [subjectTargets, setSubjectTargets] = useState<{ id: string; name: string; colorHex: string; target: number }[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: settingsData, isLoading: loadingSettings } = useSWRFetch<any>("/settings/notifications");
  const { data: subjectsData, isLoading: loadingSubjects } = useSWRFetch<any>("/subjects");

  useEffect(() => {
    if (settingsData) {
      setEnabled(settingsData.goalModeEnabled ?? false);
      const gt = settingsData.goalType ?? "none";
      setGoalType(gt === "none" ? "overall" : gt);
      setTargetPct(settingsData.goalTargetPct ?? 85);
    }
  }, [settingsData]);

  useEffect(() => {
    if (subjectsData?.subjects) {
      const activeSubjects = subjectsData.subjects.filter((s: any) => !s.isArchived);
      setSubjectTargets(activeSubjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        colorHex: s.colorHex,
        target: s.minAttendancePct ?? 75,
      })));
    }
  }, [subjectsData]);

  const updateSubjectTarget = (id: string, newTarget: number) => {
    setSubjectTargets(prev => prev.map(s => s.id === id ? { ...s, target: newTarget } : s));
  };

  async function handleSave() {
    setSaving(true);
    try {
      // 1. Save NotificationSettings
      await apiFetch("/settings/notifications", {
        method: "PUT",
        body: JSON.stringify({
          goalModeEnabled: enabled,
          goalType: enabled ? goalType : "none",
          goalTargetPct: targetPct,
          goalSetupComplete: true,
        }),
      });

      // 2. Save Subject Minimums if in subject mode
      if (enabled && goalType === "subject") {
        await Promise.all(
          subjectTargets.map(s => 
            apiFetch(`/subjects/${s.id}`, {
              method: "PUT",
              body: JSON.stringify({ minAttendancePct: s.target }),
            })
          )
        );
      }

      await invalidate("/settings/notifications");
      await invalidate("/analytics/goal-plan");
      await invalidatePrefix("/dashboard");
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loadingSettings || loadingSubjects) {
    return <FuturisticLoader title="Loading goals..." variant="full" />;
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6 pb-20">
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
          Set your attendance targets and get daily action plans
        </p>
      </div>

      <StaggerGrid className="card-3d p-6 space-y-8 transition-all" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-text text-lg">Enable Goal Mode</p>
            <p className="text-sm text-text-muted font-bold mt-0.5 max-w-sm">Show your daily attendance plan directly on your dashboard</p>
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

        {enabled && (
          <div className="space-y-6 pt-4 border-t-2 border-gray-100 dark:border-white/5">
            {/* Goal Type Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setGoalType("overall")} 
                className={clsx(
                  "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 cursor-pointer group",
                  goalType === "overall" 
                    ? "bg-[#4cc9f0]/10 border-[#4cc9f0] shadow-[0_4px_0_0_#4cc9f0]" 
                    : "bg-gray-50 border-gray-200 dark:bg-[#1a1a2e] dark:border-[#2a2a3d] hover:border-gray-300 dark:hover:border-white/20"
                )}
              >
                <Target className={clsx("w-6 h-6", goalType === "overall" ? "text-[#4cc9f0]" : "text-gray-400")} />
                <div>
                  <h3 className="font-extrabold text-[#1a1a2e] dark:text-white">Overall Goal</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">One target for everything</p>
                </div>
              </button>
              <button 
                onClick={() => setGoalType("subject")} 
                className={clsx(
                  "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 cursor-pointer group",
                  goalType === "subject" 
                    ? "bg-[#06d6a0]/10 border-[#06d6a0] shadow-[0_4px_0_0_#06d6a0]" 
                    : "bg-gray-50 border-gray-200 dark:bg-[#1a1a2e] dark:border-[#2a2a3d] hover:border-gray-300 dark:hover:border-white/20"
                )}
              >
                <ListChecks className={clsx("w-6 h-6", goalType === "subject" ? "text-[#06d6a0]" : "text-gray-400")} />
                <div>
                  <h3 className="font-extrabold text-[#1a1a2e] dark:text-white">Subject-wise</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">Unique targets per subject</p>
                </div>
              </button>
            </div>

            {/* Target percentage (Overall) */}
            {goalType === "overall" && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-black text-text">
                      Global Attendance Target
                    </label>
                    <span className="text-[#4cc9f0] text-2xl font-black tracking-tight">{targetPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={targetPct}
                    onChange={(e) => setTargetPct(parseInt(e.target.value))}
                    className="w-full accent-[#4cc9f0] cursor-pointer h-3 border-2 border-gray-200 dark:border-[#2a2a3d] bg-gray-100 dark:bg-[#0d0d1a] rounded-full shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)]"
                  />
                  <div className="flex justify-between text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-1">
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Target percentages (Subject-wise) */}
            {goalType === "subject" && (
              <div className="space-y-6 pt-2 animate-fade-in">
                <label className="block text-sm font-black text-text">
                  Individual Subject Targets
                </label>
                {subjectTargets.length === 0 ? (
                  <p className="text-sm font-bold text-gray-400">No active subjects found.</p>
                ) : (
                  subjectTargets.map(s => (
                    <div key={s.id} className="p-4 rounded-xl border-2 border-gray-100 dark:border-[#2a2a3d] bg-gray-50 dark:bg-[#141425]">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.colorHex }} />
                          <span className="font-bold text-[#1a1a2e] dark:text-white leading-tight">{s.name}</span>
                        </div>
                        <span className="text-[#06d6a0] text-xl font-black">{s.target}%</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        value={s.target}
                        onChange={(e) => updateSubjectTarget(s.id, parseInt(e.target.value))}
                        className="w-full accent-[#06d6a0] cursor-pointer h-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] rounded-full"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="p-4 bg-gray-50 dark:bg-[#141425] rounded-2xl border-2 border-gray-200 dark:border-[#2a2a3d]">
              <div className="text-sm text-text-secondary font-bold flex items-start gap-2">
                {goalType === "overall" ? (
                  targetPct >= 90 ? (
                    <>
                      <Target className="w-5 h-5 text-[#4cc9f0] shrink-0 mt-0.5" />
                      <span><strong className="text-[#4cc9f0] font-black">Ambitious!</strong> Your dashboard will show which classes are mandatory to hit {targetPct}%.</span>
                    </>
                  ) : targetPct >= 75 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#4cc9f0] shrink-0 mt-0.5" />
                      <span><strong className="text-[#4cc9f0] font-black">Solid target.</strong> You'll see a clear daily plan to maintain {targetPct}% across all subjects.</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-[#ef476f] shrink-0 mt-0.5" />
                      <span><strong className="text-[#ef476f] font-black">Low target.</strong> Consider aiming higher — {targetPct}% may be close to minimum requirements.</span>
                    </>
                  )
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#06d6a0] shrink-0 mt-0.5" />
                    <span><strong className="text-[#06d6a0] font-black">Personalized!</strong> Your dashboard will adapt to the unique target of every single subject in your schedule.</span>
                  </>
                )}
              </div>
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
