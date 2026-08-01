"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/useApi";
import { GraduationCap, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";

export default function NewSemesterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [step, setStep] = useState<"form" | "import">("form");
  const [createdSemester, setCreatedSemester] = useState<any>(null);
  const [importableSubjects, setImportableSubjects] = useState<{ orphans: any[]; fromOtherSemesters: any[] } | null>(null);
  const [selectedImports, setSelectedImports] = useState<Map<string, "move" | "copy">>(new Map());
  const [importing, setImporting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newSem = await apiFetch("/semesters", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setCreatedSemester(newSem);

      const importable = await apiFetch(`/semesters/${newSem.id}/import`);
      const allSubjectsCount = (importable.orphans?.length || 0) + (importable.fromOtherSemesters?.length || 0);

      if (allSubjectsCount > 0) {
        setImportableSubjects(importable);
        setStep("import");
      } else {
        router.push(`/semesters/${newSem.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create semester");
    } finally {
      setLoading(false);
    }
  };

  function toggleImportSelection(subjectId: string, isOrphan: boolean) {
    setSelectedImports(prev => {
      const next = new Map(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.set(subjectId, isOrphan ? "move" : "copy");
      return next;
    });
  }

  function switchImportMode(subjectId: string) {
    setSelectedImports(prev => {
      const next = new Map(prev);
      const current = next.get(subjectId);
      if (current) next.set(subjectId, current === "move" ? "copy" : "move");
      return next;
    });
  }

  async function handleImport() {
    if (selectedImports.size === 0 || importing || !createdSemester) return;
    setImporting(true);
    try {
      const subjects = Array.from(selectedImports.entries()).map(([id, mode]) => ({ id, mode }));
      await apiFetch(`/semesters/${createdSemester.id}/import`, {
        method: "POST",
        body: JSON.stringify({ subjects }),
      });
      router.push(`/semesters/${createdSemester.id}`);
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Import failed");
      setImporting(false);
    }
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <Link href="/semesters" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-gradient">Start New Semester</span>
          </h1>
          <p className="text-text-muted text-sm mt-1 ml-[52px]">
            This will archive your current semester.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {step === "form" && (

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text">Semester Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Fall 2024, Semester 5"
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text">Start Date</label>
              <input
                type="date"
                required
                className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-text">End Date</label>
              <input
                type="date"
                required
                className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
          <Link href="/semesters" className="px-6 py-3 rounded-xl font-semibold text-text hover:bg-white/5 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Semester"}
          </button>
        </div>
      </form>
      )}

      {step === "import" && (
        <div className="glass rounded-2xl p-6 space-y-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <div>
            <h2 className="text-xl font-bold text-white">Import Subjects</h2>
            <p className="mt-1 text-sm text-gray-400">
              Carry over subjects from your previous semester? Attendance will start fresh.
            </p>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {importableSubjects?.orphans && importableSubjects.orphans.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unassigned Subjects
                </h4>
                <div className="space-y-2">
                  {importableSubjects.orphans.map(subject => (
                    <ImportSubjectCard
                      key={subject.id} subject={subject} semesterName={null}
                      isSelected={selectedImports.has(subject.id)} mode={selectedImports.get(subject.id) || "move"}
                      onToggle={() => toggleImportSelection(subject.id, true)}
                      onSwitchMode={() => switchImportMode(subject.id)} isOrphan={true}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {importableSubjects?.fromOtherSemesters && importableSubjects.fromOtherSemesters.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> From Other Semesters
                </h4>
                <div className="space-y-2">
                  {importableSubjects.fromOtherSemesters.map(subject => (
                    <ImportSubjectCard
                      key={subject.id} subject={subject} semesterName={subject.semester?.name}
                      isSelected={selectedImports.has(subject.id)} mode={selectedImports.get(subject.id) || "copy"}
                      onToggle={() => toggleImportSelection(subject.id, false)}
                      onSwitchMode={() => switchImportMode(subject.id)} isOrphan={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-4 border-t border-white/5 gap-4">
            <button
              onClick={() => {
                router.push(`/semesters/${createdSemester.id}`);
                router.refresh();
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Skip — I&apos;ll add subjects later
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedImports.size === 0}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center w-full sm:w-auto"
            >
              {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : selectedImports.size > 0 ? `Import ${selectedImports.size} & Continue` : "Select subjects to import"}
            </button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function ImportSubjectCard({
  subject, semesterName, isSelected, mode, onToggle, onSwitchMode, isOrphan
}: {
  subject: any; semesterName: string | null; isSelected: boolean; mode: "move" | "copy";
  onToggle: () => void; onSwitchMode: () => void; isOrphan: boolean;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
        isSelected ? "border-purple-500/30 bg-purple-500/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
      }`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
        isSelected ? "border-purple-500 bg-purple-600" : "border-white/20 bg-white/5"
      }`}>
        {isSelected && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{subject.name}</p>
        <p className="text-xs text-gray-500">
          {semesterName ? `From ${semesterName}` : "Not assigned to any semester"}
          {subject._count?.attendanceRecords > 0 && ` · ${subject._count.attendanceRecords} records`}
        </p>
      </div>

      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onSwitchMode(); }}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
            mode === "move"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          }`}
        >
          {mode === "move" ? "Move" : "Copy"}
        </button>
      )}
    </div>
  );
}
