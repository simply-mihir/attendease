"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
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
    return <FuturisticLoader title="Loading export..." variant="full" />;
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
      <Link href="/settings" className="btn-3d-secondary inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-black cursor-pointer" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-text tracking-tight">
          <div className="w-11 h-11 rounded-2xl bg-[#06d6a0] border-2 border-[#038c67] flex items-center justify-center shadow-[0_3px_0_0_#038c67]">
            <Download className="w-5 h-5 text-white" />
          </div>
          Export Data
        </h1>
        <p className="text-text-muted text-sm font-bold mt-1 ml-[56px]">
          Download your attendance logs as a CSV spreadsheet
        </p>
      </div>

      <div className="card-3d p-6 space-y-5" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
        <div>
          <label className="block text-sm font-black text-text mb-2">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input-3d"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="p-4 bg-[#06d6a0]/10 rounded-2xl border-2 border-[#06d6a0]/30 shadow-[0_2px_0_0_#06d6a0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06d6a0] border-2 border-[#038c67] flex items-center justify-center shadow-[0_2px_0_0_#038c67] shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-text">CSV Export</p>
              <p className="text-xs font-bold text-text-muted mt-0.5">Date, Subject, Code, Status, Notes, Marked At</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-3d-success w-full py-3.5 font-black text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          {exporting ? "Exporting..." : "Download CSV"}
        </button>
      </div>
    </PageTransition>
  );
}
