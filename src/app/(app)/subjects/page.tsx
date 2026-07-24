"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import { Plus, BookOpen, Archive, RotateCcw } from "lucide-react";
import clsx from "clsx";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    apiFetch(`/subjects?archived=${showArchived}`).then((d) => setSubjects(d.subjects)).catch(console.error);
  }, [showArchived]);

  async function toggleArchive(id: string, isArchived: boolean) {
    await apiFetch(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isArchived: !isArchived }),
    });
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowArchived(!showArchived)}
            className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface transition">
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
          <Link href="/subjects/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-xl border border-border">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">{showArchived ? "No archived subjects" : "No subjects yet. Add one to get started!"}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const buffer = s.currentPercentage - s.minAttendancePct;
            const color = buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red";
            return (
              <div key={s.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition">
                <Link href={`/subjects/${s.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-12 rounded-full" style={{ backgroundColor: s.colorHex }} />
                    <div>
                      <h3 className="font-semibold">{s.name}</h3>
                      <p className="text-xs text-text-muted">{s.code || "No code"} {s.instructorName && `· ${s.instructorName}`}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-2">
                    <div className={clsx("h-full rounded-full",
                      color === "green" ? "bg-success" : color === "yellow" ? "bg-warning" : "bg-danger"
                    )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className={clsx("font-bold", color === "green" ? "text-success" : color === "yellow" ? "text-warning" : "text-danger")}>
                      {s.currentPercentage}%
                    </span>
                    <span className="text-text-muted">Required: {s.minAttendancePct}%</span>
                  </div>
                </Link>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-surface-2 rounded">{s.totalClassesHeld} classes</span>
                  <span className="px-2 py-1 bg-success/10 text-success rounded">{s.totalPresent} present</span>
                  <span className="px-2 py-1 bg-danger/10 text-danger rounded">{s.totalAbsent} absent</span>
                  <button onClick={(e) => { e.preventDefault(); toggleArchive(s.id, s.isArchived); }}
                    className="ml-auto p-1 text-text-muted hover:text-warning" title={s.isArchived ? "Restore" : "Archive"}>
                    {s.isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
