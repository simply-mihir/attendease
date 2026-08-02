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
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <Link
          href="/semesters"
          className="btn-3d-secondary p-2.5 rounded-2xl cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-text tracking-tight">
            <div className="w-11 h-11 rounded-2xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_3px_0_0_#5a189a]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            Start New Semester
          </h1>
          <p className="text-text-muted text-sm font-bold mt-1 ml-[56px]">
            This will archive your current semester.
          </p>
        </div>
      </div>

      {error && (
        <div className="card-3d p-4 border-[#ef476f] shadow-[0_4px_0_0_#ef476f] bg-[#ef476f]/10 text-[#ef476f] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-black">{error}</p>
        </div>
      )}

      {step === "form" && (
        <form
          onSubmit={handleSubmit}
          className="card-3d p-6 sm:p-8 space-y-6"
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black mb-2 text-text">Semester Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Fall 2024, Semester 5"
                className="input-3d"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black mb-2 text-text">Start Date</label>
                <input
                  type="date"
                  required
                  className="input-3d"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-black mb-2 text-text">End Date</label>
                <input
                  type="date"
                  required
                  className="input-3d"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-100 dark:border-[#2a2a3d] flex justify-end gap-3 items-center">
            <Link
              href="/semesters"
              className="btn-3d-secondary px-5 py-2.5 font-black text-sm cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-3d-primary px-6 py-2.5 font-black text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Semester"}
            </button>
          </div>
        </form>
      )}

      {step === "import" && (
        <div
          className="card-3d p-6 sm:p-8 space-y-6"
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
        >
          <div>
            <h2 className="text-xl font-black text-text">Import Subjects</h2>
            <p className="mt-1 text-sm text-text-muted font-bold">
              Carry over subjects from your previous semester? Attendance will start fresh.
            </p>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {importableSubjects?.orphans && importableSubjects.orphans.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#ff6b35]" /> Unassigned Subjects
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
                <h4 className="text-xs font-black uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00b4d8]" /> From Other Semesters
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

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-4 border-t-2 border-gray-100 dark:border-[#2a2a3d] gap-4">
            <button
              onClick={() => {
                router.push(`/semesters/${createdSemester.id}`);
                router.refresh();
              }}
              className="text-sm font-bold text-[#4a4a5a] hover:text-[#1a1a2e] dark:text-[#6b6b80] dark:hover:text-white transition-colors cursor-pointer"
            >
              Skip — I&apos;ll add subjects later
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedImports.size === 0}
              className="btn-3d-primary px-5 py-2.5 text-sm font-black disabled:opacity-50 flex items-center justify-center w-full sm:w-auto cursor-pointer"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : selectedImports.size > 0 ? `Import ${selectedImports.size} & Continue` : "Select subjects to import"}
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
      className={`flex items-center gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-[#7b2cbf] bg-[#7b2cbf]/10 shadow-[0_3px_0_0_#7b2cbf]"
          : "border-gray-200 dark:border-[#2a2a3d] bg-gray-50/80 dark:bg-[#141425] shadow-[0_2px_0_0_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
        isSelected ? "border-[#7b2cbf] bg-[#7b2cbf] text-white" : "border-gray-300 dark:border-[#2a2a3d] bg-white dark:bg-[#1f1f35]"
      }`}>
        {isSelected && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-text truncate">{subject.name}</p>
        <p className="text-xs font-bold text-text-muted">
          {semesterName ? `From ${semesterName}` : "Not assigned to any semester"}
          {subject._count?.attendanceRecords > 0 && ` · ${subject._count.attendanceRecords} records`}
        </p>
      </div>

      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onSwitchMode(); }}
          className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-black transition-all cursor-pointer border-2 ${
            mode === "move"
              ? "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35] shadow-[0_2px_0_0_#ff6b35]"
              : "bg-[#00b4d8]/15 text-[#00b4d8] border-[#00b4d8] shadow-[0_2px_0_0_#00b4d8]"
          }`}
        >
          {mode === "move" ? "Move" : "Copy"}
        </button>
      )}
    </div>
  );
}
