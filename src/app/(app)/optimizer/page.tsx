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
    <PageTransition direction="up" staggerChildren={false} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">Smart Skip Optimizer</span>
        </h1>
        <p className="text-text-muted text-sm mt-1 ml-[52px]">
          Find the safest classes to skip while staying above every subject&apos;s minimum
        </p>
      </div>

      {/* Controls */}
      <div className="glass rounded-2xl p-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <label className="block text-sm font-bold text-text mb-3">
          How many classes do you want to skip?{" "}
          <span className="text-emerald-400 text-xl">{maxSkips}</span>
        </label>
        <input
          type="range"
          min={1}
          max={15}
          value={maxSkips}
          onChange={(e) => setMaxSkips(parseInt(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
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
            "glass rounded-2xl p-5 flex items-center gap-4 border-l-4",
            result.safeToSkipAll
              ? "border-l-green-500"
              : "border-l-red-500"
          )}
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}
        >
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              result.safeToSkipAll
                ? "bg-gradient-to-br from-green-500 to-emerald-500"
                : "bg-gradient-to-br from-red-500 to-orange-500"
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
              <p className="text-sm font-bold text-green-400">
                You can safely skip {result.totalSkipsUsed} classes this week! ✨
              </p>
            ) : (
              <p className="text-sm font-bold text-red-400">
                You can only safely skip {result.totalSkipsUsed} out of {result.totalRequested} requested classes
              </p>
            )}
            <p className="text-xs text-text-muted mt-0.5">
              Skips are distributed across subjects to maximize safety margin
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <StaggerGrid className="space-y-3" delay={150} staggerDelay={80} animation="fadeSlideUp">
          {result.recommendations.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">No Safe Skips Available</h3>
              <p className="text-text-muted text-sm">
                All your subjects are too tight to skip any classes. Focus on attending!
              </p>
            </div>
          ) : (
            result.recommendations.map((rec, i) => (
              <div
                key={rec.subjectId}
                className="glass rounded-2xl p-5 hover:bg-surface-3 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-12 rounded-full"
                      style={{
                        backgroundColor: rec.colorHex,
                        boxShadow: `0 0 12px ${rec.colorHex}40`,
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-text">{rec.subjectName}</h3>
                      <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-3 h-3" />
                        Skip {rec.skipsAllocated} {rec.skipsAllocated === 1 ? "class" : "classes"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={clsx(
                          "text-lg font-bold",
                          rec.currentPct >= 75
                            ? "text-green-400"
                            : rec.currentPct >= 65
                            ? "text-yellow-400"
                            : "text-red-400"
                        )}
                      >
                        {rec.currentPct}%
                      </p>
                      <p className="text-xs text-text-muted">Current</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                    <div className="text-right">
                      <p
                        className={clsx(
                          "text-lg font-bold",
                          rec.newStatus === "green"
                            ? "text-green-400"
                            : rec.newStatus === "yellow"
                            ? "text-yellow-400"
                            : "text-red-400"
                        )}
                      >
                        {rec.newPct}%
                      </p>
                      <p className="text-xs text-text-muted">After</p>
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-1">
                  <div className="h-2 bg-surface-3 rounded-full overflow-hidden border border-border-heavy">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, rec.newPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>
                      {rec.remainingBuffer > 0
                        ? `${rec.remainingBuffer} more skips available`
                        : "No more safe skips"}
                    </span>
                    <span
                      className={clsx(
                        "font-bold",
                        rec.newStatus === "green"
                          ? "text-green-400"
                          : rec.newStatus === "yellow"
                          ? "text-yellow-400"
                          : "text-red-400"
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
