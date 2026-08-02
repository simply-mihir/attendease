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
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-[#1a1a2e] dark:text-white tracking-tight">
          <div className="w-11 h-11 rounded-2xl bg-[#06d6a0] border-2 border-[#038c67] flex items-center justify-center shadow-[0_3px_0_0_#038c67]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          Smart Skip Optimizer
        </h1>
        <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm font-bold mt-1 ml-[56px]">
          Find the safest classes to skip while staying above every subject&apos;s minimum
        </p>
      </div>

      {/* Controls */}
      <div className="card-3d p-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-black text-[#1a1a2e] dark:text-white">
            How many classes do you want to skip?
          </label>
          <span className="text-[#06d6a0] font-black text-xl px-3.5 py-0.5 bg-[#06d6a0]/15 rounded-xl border-2 border-[#06d6a0]/40 shadow-[0_2px_0_0_#06d6a0]">
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
        <div className="flex justify-between text-xs font-black text-[#4a4a5a] dark:text-[#6b6b80] mt-1.5">
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
            "card-3d p-5 flex items-center gap-4 transition-all",
            result.safeToSkipAll
              ? "border-[#06d6a0] shadow-[0_6px_0_0_#06d6a0] bg-[#06d6a0]/10"
              : "border-[#ef476f] shadow-[0_6px_0_0_#ef476f] bg-[#ef476f]/10"
          )}
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}
        >
          <div
            className={clsx(
              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2",
              result.safeToSkipAll
                ? "bg-[#06d6a0] border-[#038c67] text-white shadow-[0_3px_0_0_#038c67]"
                : "bg-[#ef476f] border-[#cc1a42] text-white shadow-[0_3px_0_0_#cc1a42]"
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
              <p className="text-sm font-black text-[#06d6a0] flex items-center gap-1.5">
                <span>You can safely skip {result.totalSkipsUsed} classes this week!</span>
                <Sparkles className="w-4 h-4 text-[#06d6a0] shrink-0 inline" />
              </p>
            ) : (
              <p className="text-sm font-black text-[#ef476f]">
                You can only safely skip {result.totalSkipsUsed} out of {result.totalRequested} requested classes
              </p>
            )}
            <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80] mt-0.5">
              Skips are distributed across subjects to maximize safety margin
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <StaggerGrid className="space-y-3" delay={150} staggerDelay={80} animation="fadeSlideUp">
          {result.recommendations.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#ef476f]/15 border-2 border-[#ef476f]/30 flex items-center justify-center mx-auto mb-3 text-[#ef476f] shadow-[0_2px_0_0_#ef476f]">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#1a1a2e] dark:text-white mb-1">No Safe Skips Available</h3>
              <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm font-bold max-w-md mx-auto">
                All your subjects are too tight to skip any classes. Focus on attending!
              </p>
            </div>
          ) : (
            result.recommendations.map((rec) => (
              <div
                key={rec.subjectId}
                className="card-3d p-5 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-12 rounded-full shadow-sm"
                      style={{
                        backgroundColor: rec.colorHex || "#FF2D78",
                      }}
                    />
                    <div>
                      <h3 className="font-black text-[#1a1a2e] dark:text-white">{rec.subjectName}</h3>
                      <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-xl text-xs font-black bg-[#06d6a0]/15 text-[#06d6a0] border-2 border-[#06d6a0]/30 shadow-[0_2px_0_0_#06d6a0]">
                        <Sparkles className="w-3 h-3 text-[#06d6a0]" />
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
                            ? "text-[#06d6a0]"
                            : rec.currentPct >= 65
                            ? "text-[#ff6b35]"
                            : "text-[#ef476f]"
                        )}
                      >
                        {rec.currentPct}%
                      </p>
                      <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">Current</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#4a4a5a] dark:text-[#6b6b80]" />
                    <div className="text-right">
                      <p
                        className={clsx(
                          "text-lg font-black",
                          rec.newStatus === "green"
                            ? "text-[#06d6a0]"
                            : rec.newStatus === "yellow"
                            ? "text-[#ff6b35]"
                            : "text-[#ef476f]"
                        )}
                      >
                        {rec.newPct}%
                      </p>
                      <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">After</p>
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-gray-200 dark:bg-[#1f1f35] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#06d6a0] transition-all duration-500"
                      style={{ width: `${Math.min(100, rec.newPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">
                    <span>
                      {rec.remainingBuffer > 0
                        ? `${rec.remainingBuffer} more skips available`
                        : "No more safe skips"}
                    </span>
                    <span
                      className={clsx(
                        "font-black",
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
      )}

      {loading && !initialLoad && (
        <FuturisticLoader variant="inline" title="Calculating optimal skip plan..." Icon={Zap} />
      )}
    </PageTransition>
  );
}
