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
        <h1 className="text-2xl font-bold text-gradient">Subjects</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowArchived(!showArchived)}
            className="btn-ghost px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition">
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
          <Link href="/subjects/new" className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">{showArchived ? "No archived subjects" : "No subjects yet. Add one to get started!"}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const buffer = s.currentPercentage - s.minAttendancePct;
            const color = buffer >= 10 ? "green" : buffer >= 0 ? "yellow" : "red";
            return (
              <div key={s.id} className="glass rounded-2xl p-5 hover:shadow-lg hover:shadow-purple-500/10 transition group">
                <Link href={`/subjects/${s.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-12 rounded-full animate-pulse-glow" style={{ backgroundColor: s.colorHex }} />
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition">{s.name}</h3>
                      <p className="text-xs text-gray-500">{s.code || "No code"} {s.instructorName && `· ${s.instructorName}`}</p>
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
                    <span className="text-gray-500">Required: {s.minAttendancePct}%</span>
                  </div>
                </Link>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-gray-400">{s.totalClassesHeld} classes</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg">{s.totalPresent} present</span>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg">{s.totalAbsent} absent</span>
                  <button onClick={(e) => { e.preventDefault(); toggleArchive(s.id, s.isArchived); }}
                    className="ml-auto p-1 text-gray-500 hover:text-yellow-400 transition" title={s.isArchived ? "Restore" : "Archive"}>
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
