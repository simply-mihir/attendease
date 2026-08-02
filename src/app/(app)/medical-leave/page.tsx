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
      <Link href="/settings" className="btn-3d-secondary inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-black cursor-pointer" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-text tracking-tight">
          <div className="w-11 h-11 rounded-2xl bg-[#ef476f] border-2 border-[#cc1a42] flex items-center justify-center shadow-[0_3px_0_0_#cc1a42]">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          Medical Leave
        </h1>
        <p className="text-text-muted text-sm font-bold mt-1 ml-[56px]">
          Bulk mark classes as excused for sick days, emergencies, or planned absences
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div className="card-3d p-5 border-[#06d6a0] shadow-[0_6px_0_0_#06d6a0] bg-[#06d6a0]/10 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06d6a0] border-2 border-[#038c67] flex items-center justify-center shadow-[0_2px_0_0_#038c67]">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-text">Leave Recorded Successfully</p>
              <p className="text-sm font-bold text-text-muted">
                Marked <span className="font-black text-[#06d6a0]">{result.marked}</span> classes as excused
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.subjects.map((name) => (
              <span key={name} className="px-3 py-1 rounded-xl text-xs font-black bg-[#06d6a0]/15 text-[#06d6a0] border-2 border-[#06d6a0]/30 shadow-[0_2px_0_0_#06d6a0]">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card-3d p-6 space-y-5" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
        {/* Date range */}
        <div>
          <label className="block text-sm font-black text-text mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7b2cbf]" /> Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-3d"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-3d"
              />
            </div>
          </div>
        </div>

        {/* Subject selection */}
        <div>
          <label className="block text-sm font-black text-text mb-2">Subjects</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setAllSubjects(true)}
              className={clsx(
                "flex-1 py-2.5 text-sm font-black transition cursor-pointer",
                allSubjects
                  ? "btn-3d-danger"
                  : "btn-3d-secondary"
              )}
            >
              All Subjects
            </button>
            <button
              onClick={() => setAllSubjects(false)}
              className={clsx(
                "flex-1 py-2.5 text-sm font-black transition cursor-pointer",
                !allSubjects
                  ? "btn-3d-danger"
                  : "btn-3d-secondary"
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
                    "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition border-2",
                    selectedSubjects.has(s.id)
                      ? "border-[#ef476f] bg-[#ef476f]/10 shadow-[0_2px_0_0_#ef476f]"
                      : "border-gray-200 dark:border-[#2a2a3d] bg-gray-50 dark:bg-[#141425]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.has(s.id)}
                    onChange={() => toggleSubject(s.id)}
                    className="w-4 h-4 accent-[#ef476f] rounded cursor-pointer"
                  />
                  <div className="w-3.5 h-3.5 rounded-lg shadow-sm" style={{ backgroundColor: s.colorHex || "#FF2D78" }} />
                  <span className="text-sm font-black text-text">{s.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-black text-text mb-2">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Medical leave, Family emergency"
            className="input-3d"
          />
        </div>

        {error && (
          <div className="p-3.5 bg-[#ef476f]/10 border-2 border-[#ef476f]/30 rounded-2xl text-sm text-[#ef476f] font-bold">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isValid}
          className="btn-3d-danger w-full py-3.5 font-black text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <HeartPulse className="w-4 h-4" /> Mark as Excused
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="card-3d p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#ff6b35] border-2 border-[#d95220] flex items-center justify-center shadow-[0_2px_0_0_#d95220]">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-black text-text">Confirm Medical Leave</h3>
            </div>
            <p className="text-sm font-bold text-text-muted">
              This will mark approximately <span className="font-black text-text">{estimateClasses()}</span> classes
              across <span className="font-black text-text">{allSubjects ? subjects.length : selectedSubjects.size}</span> subjects
              as <span className="font-black text-[#06d6a0]">excused</span>.
            </p>
            <p className="text-xs font-bold text-text-muted">
              {startDate} → {endDate} · {reason}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-3d-secondary flex-1 py-2.5 font-black text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-3d-danger flex-1 py-2.5 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
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
