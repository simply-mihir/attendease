"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { Download, FileSpreadsheet, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ExportPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiFetch("/subjects").then((d) => setSubjects(d.subjects)).catch(console.error);
  }, []);

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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/settings" className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <h1 className="text-2xl font-bold text-gradient">Export Data</h1>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            className="input-glass w-full px-4 py-2.5 rounded-xl text-sm">
            <option value="all">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">CSV Export</p>
              <p className="text-xs text-gray-500">Date, Subject, Code, Status, Notes, Marked At</p>
            </div>
          </div>
        </div>

        <button onClick={handleExport} disabled={exporting}
          className="btn-gradient w-full py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          {exporting ? "Exporting..." : "Download CSV"}
        </button>
      </div>
    </div>
  );
}
