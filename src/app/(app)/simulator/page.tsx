"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { Sliders, ArrowRight, CheckCircle2, XCircle , TestTube } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";

export default function SimulatorPage() {
  const [selectedId, setSelectedId] = useState("");
  const [scenario, setScenario] = useState<"skip" | "attend">("skip");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data, isLoading: pageLoading } = useSWRFetch<{ subjects: any[] }>("/subjects");
  const subjects = data?.subjects || [];

  // Auto-select first subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedId) {
      setSelectedId(subjects[0].id);
    }
  }, [subjects, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    apiFetch("/analytics/simulate", {
      method: "POST",
      body: JSON.stringify({ subjectId: selectedId, scenario, count }),
    })
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId, scenario, count]);

  const selected = subjects.find((s) => s.id === selectedId);

  if (pageLoading) {
    return <FuturisticLoader variant="section" title="Loading simulator" Icon={TestTube} />;
  }

  return (
    <PageTransition direction="left" staggerChildren={false} className="max-w-3xl mx-auto space-y-6 pb-12">
      <div style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          What-If Simulator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">See how skipping or attending classes affects your attendance</p>
      </div>

      <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-6 transition-all" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 50ms forwards" }}>
        {/* Subject picker */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Select Subject</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.currentPercentage}%)</option>
            ))}
          </select>
        </div>

        {/* Scenario toggle */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Scenario</label>
          <div className="flex gap-3">
            <button
              onClick={() => setScenario("skip")}
              className={clsx(
                "flex-1 py-3 rounded-xl font-bold text-sm border transition cursor-pointer flex items-center justify-center gap-2",
                scenario === "skip"
                  ? "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 shadow-md shadow-rose-500/10"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              <XCircle className="w-4 h-4" /> Skip Classes
            </button>
            <button
              onClick={() => setScenario("attend")}
              className={clsx(
                "flex-1 py-3 rounded-xl font-bold text-sm border transition cursor-pointer flex items-center justify-center gap-2",
                scenario === "attend"
                  ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 shadow-md shadow-teal-500/10"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              <CheckCircle2 className="w-4 h-4" /> Attend Classes
            </button>
          </div>
        </div>

        {/* Count slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-gray-900 dark:text-white">
              Number of classes to {scenario}
            </label>
            <span className="text-purple-600 dark:text-purple-400 font-extrabold text-lg px-2.5 py-0.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
              {count}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">
            <span>1</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
          <h3 className="font-extrabold text-base mb-4 text-gray-900 dark:text-white">Simulation Result</h3>

          <div className="flex items-center gap-4 justify-center mb-6">
            {/* Current */}
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Current</p>
              <p className={clsx("text-4xl font-extrabold",
                result.currentStatus === "green" ? "text-teal-600 dark:text-teal-400" : result.currentStatus === "yellow" ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400"
              )}>{result.currentPct}%</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            {/* After */}
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">After {scenario === "skip" ? "skipping" : "attending"} {count}</p>
              <p className={clsx("text-4xl font-extrabold",
                result.newStatus === "green" ? "text-teal-600 dark:text-teal-400" : result.newStatus === "yellow" ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400"
              )}>{result.simulatedPct}%</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={clsx("text-center p-4 rounded-2xl border",
            result.safe
              ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300"
              : "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400"
          )}>
            {result.safe ? (
              <p className="font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Safe! You&apos;ll still be above {selected?.minAttendancePct}%
              </p>
            ) : (
              <p className="font-bold flex items-center justify-center gap-1.5">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                Dangerous! You&apos;ll fall below {selected?.minAttendancePct}%
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/5 text-center">
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{result.newCanSkip}</p>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Can still skip after</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/5 text-center">
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{result.newMustAttend}</p>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Must attend to recover</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <FuturisticLoader variant="inline" title="Calculating..." Icon={TestTube} />
      )}
    </PageTransition>
  );
}
