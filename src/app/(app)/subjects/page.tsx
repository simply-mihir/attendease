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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Subjects</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowArchived(!showArchived)}
            className="rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer">
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
          <Link href="/subjects/new" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>
      </div>

      {/* Import CTA */}
      {!showArchived && (
        <div style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
          <Link
            href="/import"
            className="rounded-2xl p-4 flex items-center gap-4 bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:border-cyan-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:hover:bg-white/[0.07] dark:hover:border-cyan-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900 dark:text-white">Import from Photo</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Snap your timetable or upload a PDF/Excel to auto-add all subjects
              </p>
            </div>
            <span className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 group-hover:text-cyan-500 transition-all">
              →
            </span>
          </Link>
        </div>
      )}

      {loading ? (
        <FuturisticLoader variant="section" title="Loading subjects" Icon={BookOpen} />
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 150ms forwards" }}>
          <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">{showArchived ? "No archived subjects" : "No subjects yet. Add one to get started!"}</p>
          {!showArchived && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/subjects/new" className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Subject
              </Link>
              <Link href="/import" className="btn-gradient-cyan px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2">
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
              <div key={s.id} className="rounded-2xl p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:hover:bg-white/[0.07] transition group relative">
                <Link href={`/subjects/${s.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2.5 h-12 rounded-full" style={{ backgroundColor: s.colorHex }} />
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">{s.name}</h3>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{s.code || "No code"} {s.instructorName && `· ${s.instructorName}`}</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden mb-2">
                    <div className={clsx("h-full rounded-full transition-all duration-500",
                      color === "green" ? "bg-gradient-to-r from-teal-500 to-emerald-400" : color === "yellow" ? "bg-gradient-to-r from-orange-500 to-amber-400" : "bg-gradient-to-r from-rose-500 to-pink-400"
                    )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className={clsx("font-extrabold", color === "green" ? "text-teal-600 dark:text-teal-400" : color === "yellow" ? "text-orange-600 dark:text-orange-400" : "text-rose-600 dark:text-rose-400")}>
                      {s.currentPercentage}%
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Required: {s.minAttendancePct}%</span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 text-xs pt-3 border-t border-gray-100 dark:border-white/5">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-600 dark:text-gray-400 font-medium">{s.totalClassesHeld} classes</span>
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200/60 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20 rounded-lg font-semibold">{s.totalPresent} present</span>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 rounded-lg font-semibold">{s.totalAbsent} absent</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); toggleArchive(s.id, s.isArchived); }}
                      className="p-1.5 text-gray-400 hover:text-amber-600 dark:text-gray-500 dark:hover:text-amber-400 transition rounded-lg hover:bg-amber-50 dark:hover:bg-white/5 cursor-pointer" title={s.isArchived ? "Restore" : "Archive"}>
                      {s.isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); setDeletingSubject(s); }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-gray-500 dark:hover:text-rose-400 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer" title="Delete Subject">
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
          <div className="rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-white/10 dark:backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Subject?</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white">{deletingSubject.name}</strong> and all its attendance records?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingSubject(null)} className="rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 flex-1 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteSubject} className="bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold flex-1 py-2.5 rounded-xl text-sm shadow-md shadow-rose-500/20 hover:shadow-lg transition cursor-pointer">
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

