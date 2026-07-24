"use client";
import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/hooks/useApi";
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
      const token = getToken();
      const url = selectedSubject === "all"
        ? "/api/v1/export/csv"
        : `/api/v1/export/csv?subjectId=${selectedSubject}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      <Link href="/settings" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <h1 className="text-2xl font-bold">Export Data</h1>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm">
            <option value="all">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="p-4 bg-surface-2 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <FileSpreadsheet className="w-8 h-8 text-success" />
            <div>
              <p className="font-medium">CSV Export</p>
              <p className="text-xs text-text-muted">Date, Subject, Code, Status, Notes, Marked At</p>
            </div>
          </div>
        </div>

        <button onClick={handleExport} disabled={exporting}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          {exporting ? "Exporting..." : "Download CSV"}
        </button>
      </div>
    </div>
  );
}
