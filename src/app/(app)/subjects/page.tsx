"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { Plus, BookOpen, Archive, RotateCcw, Trash2, AlertTriangle, Camera } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";
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
        <h1 className="text-2xl font-bold text-gradient">Subjects</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowArchived(!showArchived)}
            className="btn-ghost px-3.5 py-2 rounded-xl text-sm text-text-secondary hover:text-text transition">
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
          <Link href="/subjects/new" className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>
      </div>

      {/* Import CTA */}
      {!showArchived && (
        <div style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
          <Link
            href="/import"
            className="glass rounded-2xl p-4 flex items-center gap-4 hover:bg-surface-3 transition group border-2 border-dashed border-border-heavy hover:border-cyan-500/30"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-text">Import from Photo</p>
              <p className="text-xs text-text-muted">
                Snap your timetable or upload a PDF/Excel to auto-add all subjects
              </p>
            </div>
            <span className="text-text-muted group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>
      )}

      {loading ? (
        <FuturisticLoader variant="section" title="Loading subjects" Icon={BookOpen} />
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 150ms forwards" }}>
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary mb-4">{showArchived ? "No archived subjects" : "No subjects yet. Add one to get started!"}</p>
          {!showArchived && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/subjects/new" className="btn-gradient px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Subject
              </Link>
              <Link href="/import" className="btn-gradient-cyan px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Camera className="w-4 h-4" /> Import from Photo
              </Link>
            </div>
          )}
        </div>
      ) : (
        <StaggerGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" delay={150} staggerDelay={100} animation="scaleIn">
          {subjects.map((s) => {
            const buffer = s.currentPercentage - s.minAttendancePct;
            const color = buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red";
            return (
              <div key={s.id} className="glass rounded-2xl p-5 hover:shadow-lg transition group relative">
                <Link href={`/subjects/${s.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-12 rounded-full animate-pulse-glow" style={{ backgroundColor: s.colorHex }} />
                    <div>
                      <h3 className="font-semibold text-text group-hover:text-purple-400 transition">{s.name}</h3>
                      <p className="text-xs text-text-muted">{s.code || "No code"} {s.instructorName && `· ${s.instructorName}`}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className={clsx("h-full rounded-full transition-all duration-500",
                      color === "green" ? "bg-gradient-to-r from-green-500 to-emerald-400" : color === "yellow" ? "bg-gradient-to-r from-yellow-500 to-amber-400" : "bg-gradient-to-r from-red-500 to-rose-400"
                    )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className={clsx("font-bold", color === "green" ? "text-green-400" : color === "yellow" ? "text-yellow-400" : "text-red-400")}>
                      {s.currentPercentage}%
                    </span>
                    <span className="text-text-muted">Required: {s.minAttendancePct}%</span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 text-xs pt-2 border-t border-glass-border">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400">{s.totalClassesHeld} classes</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg">{s.totalPresent} present</span>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg">{s.totalAbsent} absent</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); toggleArchive(s.id, s.isArchived); }}
                      className="p-1.5 text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 transition rounded-lg hover:bg-yellow-50 dark:hover:bg-white/5" title={s.isArchived ? "Restore" : "Archive"}>
                      {s.isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); setDeletingSubject(s); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete Subject">
                      <Trash2 className="w-4 h-4" />
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
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4 border border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">Delete Subject?</h3>
                <p className="text-xs text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              Are you sure you want to permanently delete <strong className="text-text">{deletingSubject.name}</strong> and all its attendance records?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingSubject(null)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteSubject} className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium flex-1 py-2.5 rounded-xl text-sm shadow-lg shadow-red-500/20">
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
