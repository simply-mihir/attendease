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
    return <FuturisticLoader variant="section" title="Loading semester details" Icon={GraduationCap} />;
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
          className="p-2.5 rounded-2xl bg-white border border-gray-200/60 shadow-sm hover:bg-gray-50 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
            {semester.name}
            {semester.isCurrent && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20">
                ACTIVE
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {new Date(semester.startDate).toLocaleDateString()} — {new Date(semester.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200/60 dark:border-white/10 pb-4 overflow-x-auto no-scrollbar" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        {[
          { id: "dashboard", label: "Dashboard", icon: <FileText className="w-4 h-4" /> },
          { id: "holidays", label: "Holidays", icon: <Calendar className="w-4 h-4" /> },
          { id: "exams", label: "Exam Periods", icon: <Calendar className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer",
              activeTab === t.id
                ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-white/10 dark:text-white dark:border-white/10 shadow-sm"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            )}
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
              className="rounded-3xl p-5 sm:p-6 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">Holiday Name</label>
                <input
                  type="text"
                  required
                  value={holidayName}
                  onChange={e => setHolidayName(e.target.value)}
                  placeholder="e.g. Diwali"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">Date</label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <button
                disabled={adding}
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center gap-2 h-[42px] shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Holiday
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {semester.holidays?.map((h: any) => (
                <div
                  key={h.id}
                  className="rounded-2xl p-4 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl flex items-center justify-between group hover:border-purple-300 dark:hover:border-white/20 transition-all"
                >
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{h.name}</h4>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => deleteHoliday(h.id)}
                    className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {semester.holidays?.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
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
              className="rounded-3xl p-5 sm:p-6 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">Exam Period Name</label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. Midterms"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">Start Date</label>
                <input
                  type="date"
                  required
                  value={examStart}
                  onChange={e => setExamStart(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">End Date</label>
                <input
                  type="date"
                  required
                  value={examEnd}
                  onChange={e => setExamEnd(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <button
                disabled={adding}
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center gap-2 h-[42px] shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Exam
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2">
              {semester.examPeriods?.map((ep: any) => (
                <div
                  key={ep.id}
                  className="rounded-2xl p-4 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl flex items-center justify-between group hover:border-purple-300 dark:hover:border-white/20 transition-all"
                >
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{ep.name}</h4>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {new Date(ep.startDate).toLocaleDateString()} — {new Date(ep.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteExam(ep.id)}
                    className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete exam period"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {semester.examPeriods?.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
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
