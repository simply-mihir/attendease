"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { Sliders, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

export default function SimulatorPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [scenario, setScenario] = useState<"skip" | "attend">("skip");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    apiFetch("/subjects").then((d) => {
      setSubjects(d.subjects);
      if (d.subjects.length > 0) setSelectedId(d.subjects[0].id);
    }).catch(console.error).finally(() => setPageLoading(false));
  }, []);

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
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="w-48 h-8 rounded-lg bg-white/10 animate-pulse" />
        </div>
        <div className="glass rounded-2xl p-6 space-y-6 animate-pulse">
          <div className="w-full h-10 bg-white/10 rounded-xl" />
          <div className="w-full h-10 bg-white/5 rounded-xl" />
          <div className="w-full h-32 bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">What-If Simulator</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1 ml-[52px]">See how skipping or attending classes affects your attendance</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Subject picker */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Subject</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="input-glass w-full px-4 py-2.5 rounded-xl text-sm">
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.currentPercentage}%)</option>
            ))}
          </select>
        </div>

        {/* Scenario toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Scenario</label>
          <div className="flex gap-2">
            <button onClick={() => setScenario("skip")}
              className={clsx("flex-1 py-3 rounded-xl font-medium text-sm border transition",
                scenario === "skip" ? "border-red-500/50 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/10" : "border-white/10 hover:bg-white/5 text-gray-400"
              )}>
              <XCircle className="w-4 h-4 inline mr-1.5" />Skip Classes
            </button>
            <button onClick={() => setScenario("attend")}
              className={clsx("flex-1 py-3 rounded-xl font-medium text-sm border transition",
                scenario === "attend" ? "border-green-500/50 bg-green-500/10 text-green-400 shadow-lg shadow-green-500/10" : "border-white/10 hover:bg-white/5 text-gray-400"
              )}>
              <CheckCircle2 className="w-4 h-4 inline mr-1.5" />Attend Classes
            </button>
          </div>
        </div>

        {/* Count slider */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of classes to {scenario}: <span className="text-purple-400 font-bold text-lg">{count}</span>
          </label>
          <input type="range" min={1} max={30} value={count} onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full accent-purple-500" />
          <div className="flex justify-between text-xs text-gray-500"><span>1</span><span>15</span><span>30</span></div>
        </div>
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-white">Simulation Result</h3>

          <div className="flex items-center gap-4 justify-center mb-6">
            {/* Current */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Current</p>
              <p className={clsx("text-4xl font-bold",
                result.currentStatus === "green" ? "text-green-400" : result.currentStatus === "yellow" ? "text-yellow-400" : "text-red-400"
              )}>{result.currentPct}%</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </div>
            {/* After */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">After {scenario === "skip" ? "skipping" : "attending"} {count}</p>
              <p className={clsx("text-4xl font-bold",
                result.newStatus === "green" ? "text-green-400" : result.newStatus === "yellow" ? "text-yellow-400" : "text-red-400"
              )}>{result.simulatedPct}%</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={clsx("text-center p-4 rounded-xl border",
            result.safe ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
          )}>
            {result.safe ? (
              <p className="text-green-400 font-semibold">
                <CheckCircle2 className="w-5 h-5 inline mr-1" />
                Safe! You&apos;ll still be above {selected?.minAttendancePct}%
              </p>
            ) : (
              <p className="text-red-400 font-semibold">
                <XCircle className="w-5 h-5 inline mr-1" />
                Dangerous! You&apos;ll fall below {selected?.minAttendancePct}%
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-white/5 rounded-xl text-center">
              <p className="text-lg font-bold text-white">{result.newCanSkip}</p>
              <p className="text-xs text-gray-500">Can still skip after</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-center">
              <p className="text-lg font-bold text-white">{result.newMustAttend}</p>
              <p className="text-xs text-gray-500">Must attend to recover</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500">Calculating...</div>
      )}
    </div>
  );
}
