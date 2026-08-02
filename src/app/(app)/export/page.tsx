"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { Download, FileSpreadsheet, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/PageTransition";

export default function ExportPage() {
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [exporting, setExporting] = useState(false);
  
  const { data, isLoading: pageLoading } = useSWRFetch<{ subjects: any[] }>("/subjects");
  const subjects = data?.subjects || [];

  if (pageLoading) {
    return <FuturisticLoader variant="section" title="Loading export" Icon={Download} />;
  }

  async function handleExport() {
    setExporting(true);
    try {
      const url = selectedSubject === "all"
        ? "/api/v1/export/csv"
        : `/api/v1/export/csv?subjectId=${selectedSubject}`;

      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `attendease-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { console.error(err); }
    finally { setExporting(false); }
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm font-medium transition cursor-pointer" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Download className="w-5 h-5 text-white" />
          </div>
          Export Data
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
          Download your attendance logs as a CSV spreadsheet
        </p>
      </div>

      <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-5 transition-all" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200/80 dark:border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">CSV Export</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Date, Subject, Code, Status, Notes, Marked At</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          {exporting ? "Exporting..." : "Download CSV"}
        </button>
      </div>
    </PageTransition>
  );
}
