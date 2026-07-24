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

  useEffect(() => {
    apiFetch("/subjects").then((d) => {
      setSubjects(d.subjects);
      if (d.subjects.length > 0) setSelectedId(d.subjects[0].id);
    }).catch(console.error);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sliders className="w-6 h-6 text-primary" /> What-If Simulator
        </h1>
        <p className="text-text-secondary text-sm mt-1">See how skipping or attending classes affects your attendance</p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
        {/* Subject picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Subject</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.currentPercentage}%)</option>
            ))}
          </select>
        </div>

        {/* Scenario toggle */}
        <div>
          <label className="block text-sm font-medium mb-2">Scenario</label>
          <div className="flex gap-2">
            <button onClick={() => setScenario("skip")}
              className={clsx("flex-1 py-3 rounded-lg font-medium text-sm border transition",
                scenario === "skip" ? "border-danger bg-danger/10 text-danger" : "border-border hover:bg-surface-2"
              )}>
              <XCircle className="w-4 h-4 inline mr-1.5" />Skip Classes
            </button>
            <button onClick={() => setScenario("attend")}
              className={clsx("flex-1 py-3 rounded-lg font-medium text-sm border transition",
                scenario === "attend" ? "border-success bg-success/10 text-success" : "border-border hover:bg-surface-2"
              )}>
              <CheckCircle2 className="w-4 h-4 inline mr-1.5" />Attend Classes
            </button>
          </div>
        </div>

        {/* Count slider */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Number of classes to {scenario}: <span className="text-primary font-bold text-lg">{count}</span>
          </label>
          <input type="range" min={1} max={30} value={count} onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-text-muted"><span>1</span><span>15</span><span>30</span></div>
        </div>
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Simulation Result</h3>

          <div className="flex items-center gap-4 justify-center mb-6">
            {/* Current */}
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">Current</p>
              <p className={clsx("text-4xl font-bold",
                result.currentStatus === "green" ? "text-success" : result.currentStatus === "yellow" ? "text-warning" : "text-danger"
              )}>{result.currentPct}%</p>
            </div>
            <ArrowRight className="w-8 h-8 text-text-muted" />
            {/* After */}
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">After {scenario === "skip" ? "skipping" : "attending"} {count}</p>
              <p className={clsx("text-4xl font-bold",
                result.newStatus === "green" ? "text-success" : result.newStatus === "yellow" ? "text-warning" : "text-danger"
              )}>{result.simulatedPct}%</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={clsx("text-center p-4 rounded-xl",
            result.safe ? "bg-success/10" : "bg-danger/10"
          )}>
            {result.safe ? (
              <p className="text-success font-semibold">
                <CheckCircle2 className="w-5 h-5 inline mr-1" />
                Safe! You&apos;ll still be above {selected?.minAttendancePct}%
              </p>
            ) : (
              <p className="text-danger font-semibold">
                <XCircle className="w-5 h-5 inline mr-1" />
                Dangerous! You&apos;ll fall below {selected?.minAttendancePct}%
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-surface-2 rounded-lg text-center">
              <p className="text-lg font-bold">{result.newCanSkip}</p>
              <p className="text-xs text-text-muted">Can still skip after</p>
            </div>
            <div className="p-3 bg-surface-2 rounded-lg text-center">
              <p className="text-lg font-bold">{result.newMustAttend}</p>
              <p className="text-xs text-text-muted">Must attend to recover</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-text-muted">Calculating...</div>
      )}
    </div>
  );
}
