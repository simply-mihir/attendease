"use client";
import { useState } from "react";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { apiFetch } from "@/hooks/useApi";
import { DashboardView } from "@/components/DashboardView";
import { ArrowLeft, Calendar, FileText, Plus, Trash2, Loader2, AlertCircle , GraduationCap } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { FieldLoader } from "@/components/FieldLoader";


export default function SemesterDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: semester, isLoading } = useSWRFetch<any>(`/semesters/${id}`);
  const [activeTab, setActiveTab] = useState<"dashboard" | "holidays" | "exams">("dashboard");

  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [examName, setExamName] = useState("");
  const [examStart, setExamStart] = useState("");
  const [examEnd, setExamEnd] = useState("");
  const [adding, setAdding] = useState(false);

  const addHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await apiFetch(`/semesters/${id}/holidays`, {
        method: "POST",
        body: JSON.stringify({ name: holidayName, date: holidayDate }),
      });
      setHolidayName("");
      setHolidayDate("");
      invalidate(`/semesters/${id}`);
    } finally {
      setAdding(false);
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    await apiFetch(`/semesters/${id}/holidays`, {
      method: "DELETE",
      body: JSON.stringify({ holidayId }),
    });
    invalidate(`/semesters/${id}`);
  };

  const addExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await apiFetch(`/semesters/${id}/exams`, {
        method: "POST",
        body: JSON.stringify({ name: examName, startDate: examStart, endDate: examEnd }),
      });
      setExamName("");
      setExamStart("");
      setExamEnd("");
      invalidate(`/semesters/${id}`);
    } finally {
      setAdding(false);
    }
  };

  const deleteExam = async (examId: string) => {
    await apiFetch(`/semesters/${id}/exams`, {
      method: "DELETE",
      body: JSON.stringify({ examId }),
    });
    invalidate(`/semesters/${id}`);
  };

  if (!semester && isLoading) {
    return <FuturisticLoader title="Loading semester details..." variant="full" />;
  }

  if (!semester) {
    return <div className="text-center py-20 text-red-400">Semester not found.</div>;
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <Link
          href="/semesters"
          className="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-150 flex items-center justify-center border-gray-200 bg-white text-[#4a4a5a] shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_4px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] dark:text-white flex items-center gap-3 tracking-tight">
            {semester.name}
            {semester.isCurrent && (
              <span className="rounded-lg border-2 border-[#05a87e] bg-[#06d6a0] px-2.5 py-0.5 text-xs font-bold text-white shadow-[0_2px_0_0_#05a87e]">
                ACTIVE
              </span>
            )}
          </h1>
          <p className="text-sm font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-1">
            {new Date(semester.startDate).toLocaleDateString()} — {new Date(semester.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-100 dark:border-[#2a2a3d] pb-4 overflow-x-auto no-scrollbar" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        {[
          { id: "dashboard", label: "Dashboard", icon: <FileText className="w-4 h-4" /> },
          { id: "holidays", label: "Holidays", icon: <Calendar className="w-4 h-4" /> },
          { id: "exams", label: "Exam Periods", icon: <Calendar className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? "rounded-xl border-2 border-[#cc1a5e] bg-[#FF2D78] px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#cc1a5e] dark:border-[#b81e56] dark:shadow-[0_3px_0_0_#b81e56] transition-all duration-150" : "rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-150 border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pt-2" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
        {activeTab === "dashboard" && (
          <div>
            {semester.isCurrent ? (
              <DashboardView />
            ) : (
              <DashboardView semesterId={id} />
            )}
          </div>
        )}

        {activeTab === "holidays" && (
          <div className="space-y-6">
            <form
              onSubmit={addHoliday}
              className="card-3d p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-black mb-1.5 text-text">Holiday Name</label>
                <input
                  type="text"
                  required
                  value={holidayName}
                  onChange={e => setHolidayName(e.target.value)}
                  placeholder="e.g. Diwali"
                  className="input-3d"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-black mb-1.5 text-text">Date</label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  className="input-3d"
                />
              </div>
              <button
                disabled={adding}
                type="submit"
                className="btn-3d-primary w-full sm:w-auto px-6 py-2.5 font-black text-xs flex items-center justify-center gap-2 h-[42px] cursor-pointer disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Holiday
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {semester.holidays?.map((h: any) => (
                <div
                  key={h.id}
                  className="card-3d p-4 flex items-center justify-between group transition-all"
                >
                  <div>
                    <h4 className="font-black text-sm text-text">{h.name}</h4>
                    <p className="text-xs font-bold text-text-muted">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => deleteHoliday(h.id)}
                    className="w-8 h-8 rounded-xl bg-[#ef476f]/10 text-[#ef476f] hover:bg-[#ef476f]/20 flex items-center justify-center transition-all cursor-pointer"
                    title="Delete holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {semester.holidays?.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm font-bold text-text-muted">
                  No holidays added yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "exams" && (
          <div className="space-y-6">
            <form
              onSubmit={addExam}
              className="card-3d p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-black mb-1.5 text-text">Exam Period Name</label>
                <select
                  required
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  className="input-3d"
                >
                  <option value="" disabled>Select exam type...</option>
                  <option value="Mid Semester Exam">Mid Semester Exam</option>
                  <option value="End Semester Exam">End Semester Exam</option>
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-black mb-1.5 text-text">Start Date</label>
                <input
                  type="date"
                  required
                  value={examStart}
                  onChange={e => setExamStart(e.target.value)}
                  className="input-3d"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-black mb-1.5 text-text">End Date</label>
                <input
                  type="date"
                  required
                  value={examEnd}
                  onChange={e => setExamEnd(e.target.value)}
                  className="input-3d"
                />
              </div>
              <button
                disabled={adding}
                type="submit"
                className="btn-3d-primary w-full sm:w-auto px-6 py-2.5 font-black text-xs flex items-center justify-center gap-2 h-[42px] cursor-pointer disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Exam
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2">
              {semester.examPeriods?.map((ep: any) => (
                <div
                  key={ep.id}
                  className="card-3d p-4 flex items-center justify-between group transition-all"
                >
                  <div>
                    <h4 className="font-black text-sm text-text">{ep.name}</h4>
                    <p className="text-xs font-bold text-text-muted">
                      {new Date(ep.startDate).toLocaleDateString()} — {new Date(ep.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteExam(ep.id)}
                    className="w-8 h-8 rounded-xl bg-[#ef476f]/10 text-[#ef476f] hover:bg-[#ef476f]/20 flex items-center justify-center transition-all cursor-pointer"
                    title="Delete exam period"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {semester.examPeriods?.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm font-bold text-text-muted">
                  No exam periods added yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
