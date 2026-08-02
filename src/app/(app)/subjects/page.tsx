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
        <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a2e] dark:text-white tracking-tight">Subjects</h1>
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
              <p className="font-black text-sm text-[#1a1a2e] dark:text-white">Import from Photo</p>
              <p className="text-xs font-semibold text-[#4a4a5a] dark:text-[#6b6b80]">
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
        <FuturisticLoader variant="section" title="Loading subjects" Icon={BookOpen} />
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border-2 border-gray-200 shadow-[0_6px_0_0_#d1d5db] dark:bg-[#141425] dark:border-[#2a2a3d] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 150ms forwards" }}>
          <div className="w-16 h-16 rounded-2xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_0_#cc1a5e]">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-[#4a4a5a] dark:text-[#6b6b80] mb-4 font-bold">{showArchived ? "No archived subjects" : "No subjects yet. Add one to get started!"}</p>
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
        <StaggerGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" delay={150} staggerDelay={100} animation="scaleIn">
          {subjects.map((s, idx) => {
            const buffer = s.currentPercentage - s.minAttendancePct;
            const color = buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red";
            const borderColors = [
              "hover:border-[#FF2D78] dark:hover:border-[#FF2D78]",
              "hover:border-[#06d6a0] dark:hover:border-[#06d6a0]",
              "hover:border-[#4361ee] dark:hover:border-[#4361ee]",
              "hover:border-[#ff6b35] dark:hover:border-[#ff6b35]",
              "hover:border-[#00f5d4] dark:hover:border-[#00f5d4]",
              "hover:border-[#f72585] dark:hover:border-[#f72585]",
              "hover:border-[#7b2cbf] dark:hover:border-[#7b2cbf]"
            ];
            const borderClass = borderColors[idx % borderColors.length];

            return (
              <div key={s.id} className={clsx("card-3d p-5 group relative transition-all", borderClass)}>
                <Link href={`/subjects/${s.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2.5 h-12 rounded-full shadow-sm" style={{ backgroundColor: s.colorHex || "#FF2D78" }} />
                    <div>
                      <h3 className="font-black text-[#1a1a2e] dark:text-white group-hover:text-[#FF2D78] transition">{s.name}</h3>
                      <p className="text-xs font-semibold text-[#4a4a5a] dark:text-[#6b6b80] mt-0.5">{s.code || "No code"} {s.instructorName && `· ${s.instructorName}`}</p>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-[#0f0f1c] rounded-full overflow-hidden mb-2 border border-gray-200 dark:border-[#2a2a3d]">
                    <div className={clsx("h-full rounded-full transition-all duration-500",
                      color === "green" ? "bg-[#06d6a0]" : color === "yellow" ? "bg-[#ff6b35]" : "bg-[#ef476f]"
                    )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className={clsx("font-black", color === "green" ? "text-[#06d6a0]" : color === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]")}>
                      {s.currentPercentage}%
                    </span>
                    <span className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">Required: {s.minAttendancePct}%</span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 text-xs pt-3 border-t-2 border-gray-100 dark:border-[#2a2a3d]">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-[#1f1f35] rounded-lg text-[#1a1a2e] dark:text-[#c4c4d4] font-bold border border-gray-200 dark:border-[#2a2a3d]">{s.totalClassesHeld} classes</span>
                  <span className="px-2.5 py-1 bg-[#06d6a0]/15 text-[#06d6a0] border border-[#06d6a0]/40 rounded-lg font-extrabold">{s.totalPresent} present</span>
                  <span className="px-2.5 py-1 bg-[#ef476f]/15 text-[#ef476f] border border-[#ef476f]/40 rounded-lg font-extrabold">{s.totalAbsent} absent</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); toggleArchive(s.id, s.isArchived); }}
                      className="p-1.5 text-[#6b6b80] hover:text-[#ff6b35] transition rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer" title={s.isArchived ? "Restore" : "Archive"}>
                      {s.isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); setDeletingSubject(s); }}
                      className="p-1.5 text-[#6b6b80] hover:text-[#ef476f] transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer" title="Delete Subject">
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
          <div className="rounded-2xl p-6 max-w-md w-full border-2 border-gray-200 bg-white shadow-[0_12px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ef476f]/15 text-[#ef476f] border-2 border-[#ef476f]/40 flex items-center justify-center shadow-[0_3px_0_0_#ef476f]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1a1a2e] dark:text-white">Delete Subject?</h3>
                <p className="text-xs font-semibold text-[#4a4a5a] dark:text-[#6b6b80]">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#c4c4d4]">
              Are you sure you want to permanently delete <strong className="text-[#1a1a2e] dark:text-white font-bold">{deletingSubject.name}</strong> and all its attendance records?
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

