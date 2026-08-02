"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import Link from "next/link";
import {
  ArrowLeft, HeartPulse, Calendar, CheckCircle2, AlertTriangle, Loader2,
  Hospital } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";

interface SubjectOption {
  id: string;
  name: string;
  colorHex: string;
}

export default function MedicalLeavePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [allSubjects, setAllSubjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ marked: number; subjects: string[] } | null>(null);
  const [error, setError] = useState("");

  const { data: subjectData, isLoading: loading } = useSWRFetch<any>("/subjects");
  const subjects = (subjectData?.subjects || []).filter((s: any) => !s.isArchived) as SubjectOption[];

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
    return <FuturisticLoader variant="section" title="Loading medical leave" Icon={Hospital} />;
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6 pb-12">
      <Link href="/settings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm font-medium transition cursor-pointer" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          Medical Leave
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
          Bulk mark classes as excused for sick days, emergencies, or planned absences
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div className="rounded-3xl p-5 bg-teal-50/80 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-md shadow-teal-500/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Leave Recorded Successfully</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Marked <span className="font-bold text-teal-600 dark:text-teal-400">{result.marked}</span> classes as excused
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.subjects.map((name) => (
              <span key={name} className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-500/30">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-5 transition-all" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
        {/* Date range */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" /> Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Subject selection */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Subjects</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setAllSubjects(true)}
              className={clsx(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer border",
                allSubjects
                  ? "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              All Subjects
            </button>
            <button
              onClick={() => setAllSubjects(false)}
              className={clsx(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer border",
                !allSubjects
                  ? "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              Select Specific
            </button>
          </div>

          {!allSubjects && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {subjects.map((s) => (
                <label
                  key={s.id}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border",
                    selectedSubjects.has(s.id)
                      ? "border-rose-500 bg-rose-50/80 dark:bg-rose-500/10"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.has(s.id)}
                    onChange={() => toggleSubject(s.id)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.colorHex }} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Medical leave, Family emergency"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-sm text-rose-600 dark:text-rose-400 font-bold">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isValid}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <HeartPulse className="w-4 h-4" /> Mark as Excused
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl p-6 max-w-sm w-full shadow-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Confirm Medical Leave</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will mark approximately <span className="font-bold text-gray-900 dark:text-white">{estimateClasses()}</span> classes
              across <span className="font-bold text-gray-900 dark:text-white">{allSubjects ? subjects.length : selectedSubjects.size}</span> subjects
              as <span className="font-bold text-teal-600 dark:text-teal-400">excused</span>.
            </p>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {startDate} → {endDate} · {reason}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 hover:shadow-lg transition cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
