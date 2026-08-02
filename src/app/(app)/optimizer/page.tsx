"use client";
import { useState } from "react";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { Zap, ArrowRight, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

interface Recommendation {
  subjectId: string;
  subjectName: string;
  colorHex: string;
  currentPct: number;
  skipsAllocated: number;
  newPct: number;
  newStatus: "green" | "yellow" | "red";
  remainingBuffer: number;
}

interface OptimizerResult {
  recommendations: Recommendation[];
  totalSkipsUsed: number;
  totalRequested: number;
  safeToSkipAll: boolean;
}

export default function OptimizerPage() {
  const [maxSkips, setMaxSkips] = useState(5);
  
  const { data: result, isLoading: loading } = useSWRFetch<OptimizerResult>(`/analytics/skip-optimizer?maxSkips=${maxSkips}`);
  const initialLoad = loading && !result;

  if (initialLoad) {
    return <FuturisticLoader variant="section" title="Loading optimizer" Icon={Zap} />;
  }

  return (
    <PageTransition direction="up" staggerChildren={false} className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          Smart Skip Optimizer
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
          Find the safest classes to skip while staying above every subject&apos;s minimum
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-bold text-gray-900 dark:text-white">
            How many classes do you want to skip?
          </label>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xl px-3 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
            {maxSkips}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={15}
          value={maxSkips}
          onChange={(e) => setMaxSkips(parseInt(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
        </div>
      </div>

      {/* Summary banner */}
      {result && !loading && (
        <div
          className={clsx(
            "rounded-3xl p-5 flex items-center gap-4 border transition-all",
            result.safeToSkipAll
              ? "bg-teal-50/80 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20"
              : "bg-rose-50/80 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20"
          )}
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}
        >
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md",
              result.safeToSkipAll
                ? "bg-teal-500 text-white shadow-teal-500/20"
                : "bg-rose-500 text-white shadow-rose-500/20"
            )}
          >
            {result.safeToSkipAll ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            {result.safeToSkipAll ? (
              <p className="text-sm font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                <span>You can safely skip {result.totalSkipsUsed} classes this week!</span>
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 inline" />
              </p>
            ) : (
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                You can only safely skip {result.totalSkipsUsed} out of {result.totalRequested} requested classes
              </p>
            )}
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              Skips are distributed across subjects to maximize safety margin
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <StaggerGrid className="space-y-3" delay={150} staggerDelay={80} animation="fadeSlideUp">
          {result.recommendations.length === 0 ? (
            <div className="rounded-3xl p-8 text-center bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08]">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-3 text-rose-500">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Safe Skips Available</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                All your subjects are too tight to skip any classes. Focus on attending!
              </p>
            </div>
          ) : (
            result.recommendations.map((rec) => (
              <div
                key={rec.subjectId}
                className="rounded-3xl p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-12 rounded-full"
                      style={{
                        backgroundColor: rec.colorHex,
                        boxShadow: `0 0 12px ${rec.colorHex}40`,
                      }}
                    />
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white">{rec.subjectName}</h3>
                      <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        Skip {rec.skipsAllocated} {rec.skipsAllocated === 1 ? "class" : "classes"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={clsx(
                          "text-lg font-black",
                          rec.currentPct >= 75
                            ? "text-teal-600 dark:text-teal-400"
                            : rec.currentPct >= 65
                            ? "text-amber-500 dark:text-amber-400"
                            : "text-rose-500 dark:text-rose-400"
                        )}
                      >
                        {rec.currentPct}%
                      </p>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Current</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <div className="text-right">
                      <p
                        className={clsx(
                          "text-lg font-black",
                          rec.newStatus === "green"
                            ? "text-teal-600 dark:text-teal-400"
                            : rec.newStatus === "yellow"
                            ? "text-amber-500 dark:text-amber-400"
                            : "text-rose-500 dark:text-rose-400"
                        )}
                      >
                        {rec.newPct}%
                      </p>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">After</p>
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-1.5">
                  <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, rec.newPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>
                      {rec.remainingBuffer > 0
                        ? `${rec.remainingBuffer} more skips available`
                        : "No more safe skips"}
                    </span>
                    <span
                      className={clsx(
                        "font-bold",
                        rec.newStatus === "green"
                          ? "text-teal-600 dark:text-teal-400"
                          : rec.newStatus === "yellow"
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-rose-500 dark:text-rose-400"
                      )}
                    >
                      {rec.newStatus === "green"
                        ? "Safe"
                        : rec.newStatus === "yellow"
                        ? "Caution"
                        : "Danger"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </StaggerGrid>
      )}

      {loading && !initialLoad && (
        <FuturisticLoader variant="inline" title="Calculating optimal skip plan..." Icon={Zap} />
      )}
    </PageTransition>
  );
}
