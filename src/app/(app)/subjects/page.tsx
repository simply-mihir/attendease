"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import { Plus, BookOpen, Archive, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/subjects?archived=${showArchived}`)
      .then((d) => setSubjects(d.subjects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [showArchived]);

  async function toggleArchive(id: string, isArchived: boolean) {
    await apiFetch(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isArchived: !isArchived }),
    });
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleDeleteSubject() {
    if (!deletingSubject) return;
    try {
      await apiFetch(`/subjects/${deletingSubject.id}`, { method: "DELETE" });
      setSubjects((prev) => prev.filter((s) => s.id !== deletingSubject.id));
      setDeletingSubject(null);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 h-[160px] animate-pulse flex flex-col justify-between">
              <div className="flex gap-3 items-center">
                <div className="w-3 h-12 bg-white/10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full w-full mt-4" />
              <div className="flex justify-between mt-2">
                <div className="h-3 bg-white/5 rounded w-8" />
                <div className="h-3 bg-white/5 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">{showArchived ? "No archived subjects" : "No subjects yet. Add one to get started!"}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
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
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-text-secondary">{s.totalClassesHeld} classes</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg">{s.totalPresent} present</span>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg">{s.totalAbsent} absent</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); toggleArchive(s.id, s.isArchived); }}
                      className="p-1.5 text-text-muted hover:text-yellow-400 transition rounded-lg hover:bg-white/5" title={s.isArchived ? "Restore" : "Archive"}>
                      {s.isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); setDeletingSubject(s); }}
                      className="p-1.5 text-text-muted hover:text-red-400 transition rounded-lg hover:bg-red-500/10" title="Delete Subject">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
    </div>
  );
}
