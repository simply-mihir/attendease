"use client";
import { useState } from "react";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { Zap, ArrowRight, AlertTriangle, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import { Skeleton } from "@/components/Skeleton";
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
    // We'll show skeletons
  }

  return (
    <PageTransition direction="up" staggerChildren={false} className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#06d6a0]/10">
          <Zap className="h-6 w-6 text-[#06d6a0]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">Smart Skip Optimizer</h1>
          <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">
            Find the safest classes to skip while staying above every subject&apos;s minimum
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border-2 p-6 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-bold text-[#1a1a2e] dark:text-white">
            How many classes do you want to skip?
          </label>
          <span className="text-[#06d6a0] font-extrabold text-xl px-3.5 py-0.5 bg-[#06d6a0]/10 rounded-xl border-2 border-[#05a87e] shadow-[0_2px_0_0_#05a87e]">
            {maxSkips}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={15}
          value={maxSkips}
          onChange={(e) => setMaxSkips(parseInt(e.target.value))}
          className="w-full accent-[#06d6a0] cursor-pointer h-3 rounded-lg bg-gray-200 dark:bg-[#1f1f35]"
        />
        <div className="flex justify-between text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-1.5">
          <span>1</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
        </div>
      </div>

      {initialLoad ? (
        <div className="flex justify-center py-20">
          <FuturisticLoader title="Optimizing Schedule..." variant="section" />
        </div>
      ) : result && (
        <>
          {/* Summary banner */}
          <div
            className={clsx(
              "rounded-2xl border-2 p-5 flex items-center gap-4 transition-all duration-150 mb-6",
              result.totalSkipsUsed > 0
                ? "border-[#05a87e] bg-[#06d6a0]/10 shadow-[0_4px_0_0_#05a87e] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#05a87e]"
                : "border-[#d63b5f] bg-[#ef476f]/10 shadow-[0_4px_0_0_#d63b5f] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d63b5f]"
            )}
            style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}
          >
            <div
              className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2",
                result.totalSkipsUsed > 0
                  ? "bg-[#06d6a0]/20 text-[#06d6a0] border-transparent"
                  : "bg-[#ef476f]/20 text-[#ef476f] border-transparent"
              )}
            >
              {result.totalSkipsUsed > 0 ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              {result.totalSkipsUsed > 0 ? (
                <p className="text-sm font-bold text-[#06d6a0] flex items-center gap-1.5">
                  {result.safeToSkipAll ? (
                    <>
                      <span>You can safely skip {result.totalSkipsUsed} classes this week!</span>
                      <Sparkles className="w-4 h-4 text-[#06d6a0] shrink-0 inline" />
                    </>
                  ) : (
                    <span>You can safely skip {result.totalSkipsUsed} out of {result.totalRequested} requested classes</span>
                  )}
                </p>
              ) : (
                <p className="text-sm font-bold text-[#ef476f]">
                  You cannot safely skip any requested classes
                </p>
              )}
              <p className={clsx("text-xs font-bold mt-0.5 opacity-80", result.totalSkipsUsed > 0 ? "text-[#06d6a0]" : "text-[#ef476f]")}>
                Skips are distributed across subjects to maximize safety margin
              </p>
            </div>
          </div>

          {/* Results */}
        <StaggerGrid className={clsx("space-y-3", loading && "opacity-50")} delay={150} staggerDelay={80} animation="fadeSlideUp">
          {result.recommendations.length === 0 ? (
            <div className="rounded-2xl border-2 p-8 text-center border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]">
              <div className="w-14 h-14 rounded-2xl bg-[#ef476f]/10 border-2 border-[#d63b5f] flex items-center justify-center mx-auto mb-3 text-[#ef476f] shadow-[0_2px_0_0_#d63b5f]">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-white mb-1">No Safe Skips Available</h3>
              <p className="text-[#9ca3af] dark:text-[#6b6b80] text-sm max-w-md mx-auto">
                All your subjects are too tight to skip any classes. Focus on attending!
              </p>
            </div>
          ) : (
            result.recommendations.map((rec) => (
              <div
                key={rec.subjectId}
                className="rounded-2xl border-2 p-5 transition-all duration-150 border-gray-200 bg-white shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_4px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]" style={{ borderLeftWidth: "4px", borderLeftColor: rec.colorHex || "#FF2D78" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-bold text-[#1a1a2e] dark:text-white">{rec.subjectName}</h3>
                      {rec.skipsAllocated > 0 ? (
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#06d6a0] text-white border-2 border-[#05a87e] shadow-[0_2px_0_0_#05a87e]">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          Skip {rec.skipsAllocated} {rec.skipsAllocated === 1 ? "class" : "classes"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#ef476f] text-white border-2 border-[#d63b5f] shadow-[0_2px_0_0_#d63b5f]">
                          <XCircle className="w-3 h-3 text-white" />
                          Cannot skip
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={clsx(
                          "text-lg font-extrabold tracking-tight",
                          rec.currentPct >= 75
                            ? "text-[#06d6a0]"
                            : rec.currentPct >= 65
                            ? "text-[#ff6b35]"
                            : "text-[#ef476f]"
                        )}
                      >
                        {rec.currentPct}%
                      </p>
                      <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">Current</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#9ca3af] dark:text-[#6b6b80]" />
                    <div className="text-right">
                      <p
                        className={clsx(
                          "text-lg font-extrabold tracking-tight",
                          rec.newStatus === "green"
                            ? "text-[#06d6a0]"
                            : rec.newStatus === "yellow"
                            ? "text-[#ff6b35]"
                            : "text-[#ef476f]"
                        )}
                      >
                        {rec.newPct}%
                      </p>
                      <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">After</p>
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-gray-200 dark:bg-[#1f1f35] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] mt-2">
                    <div
                      className="h-full rounded-full bg-[#06d6a0] transition-all duration-500 shadow-[0_2px_0_0_rgba(0,0,0,0.2)]"
                      style={{ width: `${Math.min(100, rec.newPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">
                    <span>
                      {rec.remainingBuffer > 0
                        ? `${rec.remainingBuffer} more skips available`
                        : "No more safe skips"}
                    </span>
                    <span
                      className={clsx(
                        "font-extrabold",
                        rec.newStatus === "green"
                          ? "text-[#06d6a0]"
                          : rec.newStatus === "yellow"
                          ? "text-[#ff6b35]"
                          : "text-[#ef476f]"
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
        </>
      )}

      {loading && !initialLoad && (
        <div className="flex justify-center p-4">
          <FieldLoader size="md" />
        </div>
      )}
    </PageTransition>
  );
}
