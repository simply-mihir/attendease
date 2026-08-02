"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { Plus, BookOpen, Archive, RotateCcw, Trash2, AlertTriangle, Camera, TrendingUp, Minus, TrendingDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

const SUBJECT_COLORS = [
  { bg: "#FF2D78", shadow: "#cc1a5e", label: "Hot Pink" },
  { bg: "#4361ee", shadow: "#3451cc", label: "Royal Blue" },
  { bg: "#06d6a0", shadow: "#05a87e", label: "Teal" },
  { bg: "#ff6b35", shadow: "#cc5529", label: "Orange" },
  { bg: "#9b5de5", shadow: "#7c4ab8", label: "Purple" },
  { bg: "#4cc9f0", shadow: "#3aa3c4", label: "Cyan" },
  { bg: "#f15bb5", shadow: "#c14890", label: "Magenta" },
  { bg: "#FFD166", shadow: "#ccaa52", label: "Gold" },
  { bg: "#ef476f", shadow: "#c43559", label: "Coral" },
  { bg: "#2ec4b6", shadow: "#249e92", label: "Mint" },
];
export default function SubjectsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<any | null>(null);

  const { data, isLoading: loading } = useSWRFetch<{ subjects: any[] }>(`/subjects?archived=${showArchived}`);
  const subjects = data?.subjects || [];

  async function toggleArchive(id: string, isArchived: boolean) {
    await apiFetch(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isArchived: !isArchived }),
    });
    // Invalidate the cache to fetch updated list
    await invalidate(`/subjects?archived=${showArchived}`);
    await invalidate(`/dashboard`); // Subjects can change dashboard stats
  }

  async function handleDeleteSubject() {
    if (!deletingSubject) return;
    try {
      await apiFetch(`/subjects/${deletingSubject.id}`, { method: "DELETE" });
      setDeletingSubject(null);
      await invalidate(`/subjects?archived=${showArchived}`);
      await invalidate(`/dashboard`);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <PageTransition direction="left" staggerChildren={false} className="space-y-6">
      <div className="flex items-center justify-between" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">Subjects</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowArchived(!showArchived)}
            className="btn-3d-secondary px-3.5 py-2 text-sm font-bold cursor-pointer">
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
          <Link href="/subjects/new" className="btn-3d-primary flex items-center gap-2 px-4 py-2 text-sm font-black">
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>
      </div>

      {/* Import CTA */}
      {!showArchived && (
        <div style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
          <Link
            href="/import"
            className="card-3d p-4 flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00f5d4] border-2 border-[#00c4a7] flex items-center justify-center shadow-[0_3px_0_0_#00a890] shrink-0">
              <Camera className="w-5 h-5 text-[#0d0d1a]" />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm text-text">Import from Photo</p>
              <p className="text-xs font-semibold text-text-muted">
                Snap your timetable or upload a PDF/Excel to auto-add all subjects
              </p>
            </div>
            <span className="text-[#6b6b80] group-hover:translate-x-1 group-hover:text-[#00f5d4] transition-all font-black">
              →
            </span>
          </Link>
        </div>
      )}

      {loading ? (
        <StaggerGrid className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" delay={150} staggerDelay={80} animation="scaleIn">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border-2 p-5 border-gray-200 bg-white/50 shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425]/50 dark:shadow-[0_6px_0_0_#0d0d1a] flex flex-col justify-between h-[160px]">
              <div className="flex justify-between items-start mb-2">
                <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-white/5" />
                <div className="h-8 w-12 rounded-lg bg-gray-200 dark:bg-white/5" />
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-white/5 rounded-md mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-white/5 rounded-md" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FieldLoader size="lg" />
              </div>
            </div>
          ))}
        </StaggerGrid>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border-2 border-gray-200 shadow-[0_6px_0_0_#d1d5db] dark:bg-[#141425] dark:border-[#2a2a3d] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 150ms forwards" }}>
          <div className="w-16 h-16 rounded-2xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_0_#cc1a5e]">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-text-muted mb-4 font-bold">{showArchived ? "No archived subjects" : "No subjects yet. Add one to get started!"}</p>
          {!showArchived && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/subjects/new" className="btn-3d-primary px-5 py-2.5 text-sm font-black inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Subject
              </Link>
              <Link href="/import" className="btn-3d-cyan px-5 py-2.5 rounded-xl text-sm font-black inline-flex items-center gap-2">
                <Camera className="w-4 h-4" /> Import from Photo
              </Link>
            </div>
          )}
        </div>
      ) : (
        <StaggerGrid className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" delay={150} staggerDelay={80} animation="scaleIn">
          {subjects.map((s, index) => {
            const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
            const percentage = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
            const min = s.minAttendancePct ?? 75;
            const attended = s.totalPresent ?? 0;
            const total = s.totalClassesHeld ?? 0;
            
            // Pick status icon
            const StatusIcon = percentage >= min ? TrendingUp : percentage >= min - 15 ? Minus : TrendingDown;
            
            return (
              <div
                key={s.id}
                className="group relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-150 block hover:translate-y-[2px] overflow-hidden flex flex-col justify-between"
                style={{
                  borderColor: `${color.bg}40`,
                  backgroundColor: `${color.bg}0D`,
                  boxShadow: `0 6px 0 0 ${color.bg}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 0 0 ${color.bg}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 6px 0 0 ${color.bg}30`;
                  e.currentTarget.style.transform = '';
                }}
              >
                {/* Animated gradient shimmer on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${color.bg}08 0%, ${color.bg}15 50%, ${color.bg}08 100%)`,
                    backgroundSize: "200% 200%",
                    animation: "subjectCardShimmer 3s ease-in-out infinite",
                  }} />

                {/* Top accent line */}
                <div className="absolute inset-x-0 top-0 h-[2px]"
                  style={{ background: `linear-gradient(to right, transparent, ${color.bg}60, transparent)` }} />

                <Link href={`/subjects/${s.id}`} className="relative block flex-1">
                  {/* Row 1: Label + Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider break-words pr-2"
                      style={{ color: color.bg }}>
                      {s.name}
                    </p>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg group-hover:scale-110 transition-all duration-300"
                      style={{ backgroundColor: `${color.bg}1A`, color: color.bg }}>
                      <BookOpen className="h-4 w-4 block group-hover:hidden" />
                      <ChevronRight className="h-4 w-4 hidden group-hover:block" />
                    </div>
                  </div>

                  {/* Row 2: Big percentage number */}
                  <p className="text-3xl font-extrabold text-text mb-1">
                    {percentage}%
                  </p>

                  {/* Row 3: Status + class count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <StatusIcon className="h-3.5 w-3.5" style={{ color: color.bg }} />
                      <span className="text-xs font-semibold"
                        style={{ color: percentage >= min ? "#06d6a0" : percentage >= min - 15 ? "#ff6b35" : "#ef476f" }}>
                        {percentage >= min ? "On track" : percentage >= min - 15 ? "At risk" : "Danger"}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#9ca3af] dark:text-[#6b6b80]">
                      {attended}/{total}
                    </span>
                  </div>

                  {/* Row 4: Mini progress bar */}
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                          backgroundColor: color.bg,
                          boxShadow: `0 0 8px ${color.bg}40`,
                        }} />
                    </div>
                  </div>

                  {/* Subject code — small */}
                  <p className="text-[10px] text-[#9ca3af] dark:text-[#6b6b80] mt-2 font-semibold">
                    {s.code || "No code"}
                  </p>

                </Link>

                <div className="relative flex items-center justify-between pt-3 mt-4 border-t-2" style={{ borderColor: `${color.bg}20` }}>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: `${color.bg}1A`, color: color.bg }}>{s.totalClassesHeld} held</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); toggleArchive(s.id, s.isArchived); }}
                      className="p-1.5 transition rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer" style={{ color: color.bg }} title={s.isArchived ? "Restore" : "Archive"}>
                      {s.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); setDeletingSubject(s); }}
                      className="p-1.5 transition rounded-lg hover:bg-rose-500/10 cursor-pointer text-rose-500" title="Delete Subject">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </StaggerGrid>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl p-6 max-w-md w-full border-2 border-gray-200 bg-white shadow-[0_12px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ef476f]/15 text-[#ef476f] border-2 border-[#ef476f]/40 flex items-center justify-center shadow-[0_3px_0_0_#ef476f]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-text">Delete Subject?</h3>
                <p className="text-xs font-semibold text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm font-medium text-text-secondary">
              Are you sure you want to permanently delete <strong className="text-text font-bold">{deletingSubject.name}</strong> and all its attendance records?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingSubject(null)} className="btn-3d-secondary flex-1 py-2.5 text-sm font-bold cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteSubject} className="btn-3d-coral text-white font-black flex-1 py-2.5 text-sm cursor-pointer">
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

