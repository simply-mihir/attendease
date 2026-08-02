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
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-text tracking-tight">
          <div className="w-11 h-11 rounded-2xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_3px_0_0_#5a189a]">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          What-If Simulator
        </h1>
        <p className="text-text-muted text-sm font-bold mt-1 ml-[56px]">See how skipping or attending classes affects your attendance</p>
      </div>

      <div className="card-3d p-6 space-y-6" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 50ms forwards" }}>
        {/* Subject picker */}
        <div>
          <label className="block text-sm font-black text-text mb-2">Select Subject</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-3d"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.currentPercentage}%)</option>
            ))}
          </select>
        </div>

        {/* Scenario toggle */}
        <div>
          <label className="block text-sm font-black text-text mb-2">Scenario</label>
          <div className="flex gap-3">
            <button
              onClick={() => setScenario("skip")}
              className={clsx(
                "flex-1 py-3 font-black text-sm transition cursor-pointer flex items-center justify-center gap-2",
                scenario === "skip"
                  ? "btn-3d-danger"
                  : "btn-3d-secondary"
              )}
            >
              <XCircle className="w-4 h-4" /> Skip Classes
            </button>
            <button
              onClick={() => setScenario("attend")}
              className={clsx(
                "flex-1 py-3 font-black text-sm transition cursor-pointer flex items-center justify-center gap-2",
                scenario === "attend"
                  ? "btn-3d-success"
                  : "btn-3d-secondary"
              )}
            >
              <CheckCircle2 className="w-4 h-4" /> Attend Classes
            </button>
          </div>
        </div>

        {/* Count slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-black text-text">
              Number of classes to {scenario}
            </label>
            <span className="text-[#7b2cbf] dark:text-[#c77dff] font-black text-lg px-3 py-0.5 bg-[#7b2cbf]/15 rounded-xl border-2 border-[#7b2cbf]/40 shadow-[0_2px_0_0_#7b2cbf]">
              {count}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full accent-[#7b2cbf] cursor-pointer h-3 rounded-lg bg-gray-200 dark:bg-[#1f1f35]"
          />
          <div className="flex justify-between text-xs font-black text-text-muted mt-1.5">
            <span>1</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="card-3d p-6" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
          <h3 className="font-black text-base mb-4 text-text">Simulation Result</h3>

          <div className="flex items-center gap-4 justify-center mb-6">
            {/* Current */}
            <div className="text-center">
              <p className="text-xs font-bold text-text-muted mb-1">Current</p>
              <p className={clsx("text-4xl font-black",
                result.currentStatus === "green" ? "text-[#06d6a0]" : result.currentStatus === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]"
              )}>{result.currentPct}%</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#1f1f35] border-2 border-gray-200 dark:border-[#2a2a3d] flex items-center justify-center shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </div>
            {/* After */}
            <div className="text-center">
              <p className="text-xs font-bold text-text-muted mb-1">After {scenario === "skip" ? "skipping" : "attending"} {count}</p>
              <p className={clsx("text-4xl font-black",
                result.newStatus === "green" ? "text-[#06d6a0]" : result.newStatus === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]"
              )}>{result.simulatedPct}%</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={clsx("text-center p-4 rounded-2xl border-2",
            result.safe
              ? "bg-[#06d6a0]/15 border-[#06d6a0] text-[#06d6a0] shadow-[0_3px_0_0_#06d6a0]"
              : "bg-[#ef476f]/15 border-[#ef476f] text-[#ef476f] shadow-[0_3px_0_0_#ef476f]"
          )}>
            {result.safe ? (
              <p className="font-black flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-[#06d6a0]" />
                Safe! You&apos;ll still be above {selected?.minAttendancePct}%
              </p>
            ) : (
              <p className="font-black flex items-center justify-center gap-1.5">
                <XCircle className="w-5 h-5 text-[#ef476f]" />
                Dangerous! You&apos;ll fall below {selected?.minAttendancePct}%
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-gray-50 dark:bg-[#141425] rounded-2xl border-2 border-gray-200 dark:border-[#2a2a3d] text-center shadow-[0_3px_0_0_rgba(0,0,0,0.1)]">
              <p className="text-xl font-black text-text">{result.newCanSkip}</p>
              <p className="text-xs font-bold text-text-muted mt-0.5">Can still skip after</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#141425] rounded-2xl border-2 border-gray-200 dark:border-[#2a2a3d] text-center shadow-[0_3px_0_0_rgba(0,0,0,0.1)]">
              <p className="text-xl font-black text-text">{result.newMustAttend}</p>
              <p className="text-xs font-bold text-text-muted mt-0.5">Must attend to recover</p>
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
