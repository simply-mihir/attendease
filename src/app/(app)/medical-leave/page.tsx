"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import Link from "next/link";
import {
  ArrowLeft, HeartPulse, Calendar, CheckCircle2, AlertTriangle, Loader2,
} from "lucide-react";
import clsx from "clsx";

interface SubjectOption {
  id: string;
  name: string;
  colorHex: string;
}

export default function MedicalLeavePage() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [allSubjects, setAllSubjects] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ marked: number; subjects: string[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/subjects")
      .then((d) => {
        const subs = (d.subjects || []).filter((s: any) => !s.isArchived);
        setSubjects(subs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function estimateClasses(): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    // Rough estimate: ~1-2 classes per weekday
    const weekdays = Math.ceil(days * (5 / 7));
    const subjectCount = allSubjects ? subjects.length : selectedSubjects.size;
    return weekdays * Math.max(1, Math.ceil(subjectCount * 0.6));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        startDate,
        endDate,
        reason,
      };
      if (!allSubjects && selectedSubjects.size > 0) {
        payload.subjectIds = Array.from(selectedSubjects);
      }
      const res = await apiFetch("/attendance/medical-leave", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(res);
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit medical leave");
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = startDate && endDate && reason.trim().length > 0 && (allSubjects || selectedSubjects.size > 0);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="h-8 w-48 rounded-xl bg-white/10 animate-pulse" />
        <div className="glass rounded-2xl p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/settings" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">Medical Leave</span>
        </h1>
        <p className="text-text-muted text-sm mt-1 ml-[52px]">
          Bulk mark classes as excused for sick days, emergencies, or planned absences
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div className="glass rounded-2xl p-5 border-green-500/30 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-text">Leave Recorded Successfully</p>
              <p className="text-sm text-text-secondary">
                Marked <span className="font-bold text-green-400">{result.marked}</span> classes as excused
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.subjects.map((name) => (
              <span key={name} className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Date range */}
        <div>
          <label className="block text-sm font-bold text-text mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" /> Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-glass w-full py-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-glass w-full py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Subject selection */}
        <div>
          <label className="block text-sm font-bold text-text mb-2">Subjects</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setAllSubjects(true)}
              className={clsx(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition border-2",
                allSubjects
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent bg-surface-3 text-text-muted hover:text-text"
              )}
            >
              All Subjects
            </button>
            <button
              onClick={() => setAllSubjects(false)}
              className={clsx(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition border-2",
                !allSubjects
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent bg-surface-3 text-text-muted hover:text-text"
              )}
            >
              Select Specific
            </button>
          </div>

          {!allSubjects && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subjects.map((s) => (
                <label
                  key={s.id}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border-2",
                    selectedSubjects.has(s.id)
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-surface-3 hover:bg-surface-3/80"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.has(s.id)}
                    onChange={() => toggleSubject(s.id)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.colorHex }} />
                  <span className="text-sm font-semibold text-text">{s.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-bold text-text mb-2">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Medical leave, Family emergency"
            className="input-glass w-full py-2.5 rounded-xl text-sm"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 font-bold">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isValid}
          className="btn-gradient w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <HeartPulse className="w-4 h-4" /> Mark as Excused
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-black text-text">Confirm Medical Leave</h3>
            </div>
            <p className="text-sm text-text-secondary">
              This will mark approximately <span className="font-bold text-text">{estimateClasses()}</span> classes
              across <span className="font-bold text-text">{allSubjects ? subjects.length : selectedSubjects.size}</span> subjects
              as <span className="font-bold text-green-400">excused</span>.
            </p>
            <p className="text-xs text-text-muted">
              {startDate} → {endDate} · {reason}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-ghost flex-1 py-3 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-gradient flex-1 py-3 text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
