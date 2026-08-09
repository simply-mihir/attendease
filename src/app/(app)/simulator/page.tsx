"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { Sliders, ArrowRight, CheckCircle2, XCircle , TestTube } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";

export default function SimulatorPage() {
  const [selectedId, setSelectedId] = useState("");
  const [scenario, setScenario] = useState<"skip" | "attend">("skip");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [hasRun, setHasRun] = useState(false);

  const { data, isLoading: pageLoading } = useSWRFetch<{ subjects: any[] }>("/subjects");
  const subjects = data?.subjects || [];

  // Auto-select first subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedId) {
      setSelectedId(subjects[0].id);
    }
  }, [subjects, selectedId]);

  const handleSimulate = () => {
    if (!selectedId) return;
    setLoading(true);
    setHasRun(true);
    apiFetch("/analytics/simulate", {
      method: "POST",
      body: JSON.stringify({ subjectId: selectedId, scenario, count }),
    })
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const selected = subjects.find((s) => s.id === selectedId);

  if (pageLoading) {
    return <FuturisticLoader variant="full" title="Loading simulator..." Icon={TestTube} />;
  }

  return (
    <PageTransition direction="left" staggerChildren={false} className="max-w-3xl mx-auto space-y-6 pb-12">
      <style dangerouslySetInnerHTML={{
        __html: `
        .pop-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 4px solid var(--slider-color);
          box-shadow: 0 0 12px var(--slider-color), 0 4px 6px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
        }
        .pop-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px var(--slider-color), 0 6px 8px rgba(0,0,0,0.3);
        }
        .pop-slider::-webkit-slider-thumb:active {
          transform: scale(0.9);
        }
        .pop-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 4px solid var(--slider-color);
          box-shadow: 0 0 12px var(--slider-color), 0 4px 6px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
        }
        .pop-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px var(--slider-color), 0 6px 8px rgba(0,0,0,0.3);
        }
      `}} />
      <div className="flex items-center gap-3 mb-6" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9b5de5]/10">
          <Sliders className="h-6 w-6 text-[#9b5de5]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">What-If Simulator</h1>
          <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">See how skipping or attending classes affects your attendance</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 p-6 space-y-6 bg-gradient-to-br from-[#fca311]/15 to-[#fca311]/5 border-[#fca311]/40 shadow-[0_6px_0_0_#fca311] dark:from-[#fca311]/20 dark:to-[#fca311]/5 dark:shadow-[0_6px_0_0_#e89510] transition-all duration-500 ease-out relative overflow-hidden" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 50ms forwards" }}>
        {/* Subject picker */}
        <div>
          <label className="block text-sm font-bold text-[#1a1a2e] dark:text-white mb-2">Select Subject</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-150 border-gray-200 bg-white text-[#1a1a2e] shadow-[0_3px_0_0_#d1d5db] focus:border-[#4361ee] focus:outline-none focus:ring-4 focus:ring-[#4361ee]/20 dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-white dark:shadow-[0_3px_0_0_#0d0d1a] dark:focus:border-[#4361ee] appearance-none cursor-pointer"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.currentPercentage}%)</option>
            ))}
          </select>
        </div>

        {/* Scenario toggle */}
        <div>
          <label className="block text-sm font-bold text-[#1a1a2e] dark:text-white mb-2">Scenario</label>
          <div className="flex rounded-xl border-2 overflow-hidden border-gray-200/50 shadow-[0_3px_0_0_rgba(0,0,0,0.05)] dark:border-[#2a2a3d]/50 dark:shadow-[0_3px_0_0_#0d0d1a]">
            <button
              onClick={() => setScenario("skip")}
              className={`flex-1 py-3 text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${scenario === "skip" ? "bg-[#FF2D78] text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.2)]" : "bg-transparent text-[#4a4a5a] hover:bg-black/5 hover:scale-[1.02] active:scale-95 dark:text-[#c4c4d4] dark:hover:bg-white/5"}`}
            >
              <XCircle className={`w-4 h-4 transition-transform duration-300 ${scenario === "skip" ? "scale-110" : ""}`} /> Skip Classes
            </button>
            <button
              onClick={() => setScenario("attend")}
              className={`flex-1 py-3 text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${scenario === "attend" ? "bg-[#0ea5e9] text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.2)]" : "bg-transparent text-[#4a4a5a] hover:bg-black/5 hover:scale-[1.02] active:scale-95 dark:text-[#c4c4d4] dark:hover:bg-white/5"}`}
            >
              <CheckCircle2 className={`w-4 h-4 transition-transform duration-300 ${scenario === "attend" ? "scale-110" : ""}`} /> Attend Classes
            </button>
          </div>
        </div>

        {/* Count slider */}
        <div className="transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-bold text-[#1a1a2e] dark:text-white transition-colors duration-300">
              Number of classes to {scenario}
            </label>
            <span className={`font-extrabold text-xl px-4 py-1.5 rounded-xl border-2 shadow-[0_3px_0_0_rgba(0,0,0,0.1)] transition-all duration-300 ${scenario === 'skip' ? 'text-[#FF2D78] bg-[#FF2D78]/10 border-[#FF2D78]/30 shadow-[#FF2D78]/20' : 'text-[#0ea5e9] bg-[#0ea5e9]/10 border-[#0ea5e9]/30 shadow-[#0ea5e9]/20'}`}>
              {count}
            </span>
          </div>
          <div className="relative pt-4 pb-4">
            <input
              type="range"
              min={1}
              max={30}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className={`w-full cursor-pointer h-4 rounded-full appearance-none transition-all duration-300 pop-slider outline-none`}
              style={{
                '--slider-color': scenario === 'skip' ? '#FF2D78' : '#0ea5e9',
                background: `linear-gradient(to right, ${scenario === 'skip' ? '#FF2D78' : '#0ea5e9'} ${(count - 1) / 29 * 100}%, rgba(156, 163, 175, 0.2) ${(count - 1) / 29 * 100}%)`,
              } as React.CSSProperties}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-2">
            <span>1</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>

        {/* Run Simulator Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-fit relative overflow-hidden rounded-xl border-2 border-[#fca311] bg-[#fca311] px-10 py-3.5 text-sm font-black text-[#1a1a2e] shadow-[0_4px_0_0_#e89510] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#e89510] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <FieldLoader size="sm" /> : <><TestTube className="w-5 h-5" /> Run Simulation</>}
          </button>
        </div>
      </div>

      {/* Result */}
      {hasRun && !loading && result && (
        <div className={`rounded-2xl border-2 p-6 transition-all duration-500 ease-out ${result.safe ? 'bg-[#06d6a0]/5 border-[#06d6a0]/40 shadow-[0_6px_0_0_#06d6a0] dark:bg-[#06d6a0]/10 dark:shadow-[0_6px_0_0_#049e77]' : 'bg-[#ef476f]/5 border-[#ef476f]/40 shadow-[0_6px_0_0_#ef476f] dark:bg-[#ef476f]/10 dark:shadow-[0_6px_0_0_#d63b5f]'}`} style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
          <h3 className="font-extrabold text-lg mb-4 text-[#1a1a2e] dark:text-white">Simulation Result</h3>

          <div className="flex items-center gap-4 justify-center mb-6">
            {/* Current */}
            <div className="text-center">
              <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mb-1">Current</p>
              <p className={clsx("text-4xl font-black",
                result.currentStatus === "green" ? "text-[#06d6a0]" : result.currentStatus === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]"
              )}>{result.currentPct}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a]">
              <ArrowRight className="w-5 h-5" />
            </div>
            {/* After */}
            <div className="text-center">
              <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mb-1">After {scenario === "skip" ? "skipping" : "attending"} {count}</p>
              <p className={clsx("text-4xl font-black",
                result.newStatus === "green" ? "text-[#06d6a0]" : result.newStatus === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]"
              )}>{result.simulatedPct}%</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={clsx("text-center p-4 rounded-xl border-2",
            result.safe
              ? "bg-[#06d6a0]/10 border-[#05a87e] text-[#06d6a0] shadow-[0_3px_0_0_#05a87e]"
              : "bg-[#ef476f]/10 border-[#d63b5f] text-[#ef476f] shadow-[0_3px_0_0_#d63b5f]"
          )}>
            {result.safe ? (
              <p className="font-extrabold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-[#06d6a0]" />
                You are safe! Attendance remains above {selected?.minAttendancePct}%.
              </p>
            ) : (
              <p className="font-extrabold flex items-center justify-center gap-1.5">
                <XCircle className="w-5 h-5 text-[#ef476f]" />
                Warning! Attendance drops below {selected?.minAttendancePct}%.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="rounded-2xl border-2 p-4 text-center transition-all duration-150 border-gray-200 bg-white shadow-[0_4px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_4px_0_0_#0d0d1a]">
              <p className="text-xl font-extrabold text-[#1a1a2e] dark:text-white">{result.newCanSkip}</p>
              <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">Can still skip</p>
            </div>
            <div className="rounded-2xl border-2 p-4 text-center transition-all duration-150 border-gray-200 bg-white shadow-[0_4px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_4px_0_0_#0d0d1a]">
              <p className="text-xl font-extrabold text-[#1a1a2e] dark:text-white">{result.newMustAttend}</p>
              <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">Must attend</p>
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
