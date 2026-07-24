"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { ArrowLeft, Plus, Trash2, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false });
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await apiFetch("/semesters");
    setSemesters(data.semesters);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/semesters", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", startDate: "", endDate: "", isCurrent: false });
      setShowForm(false);
      await load();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function setActive(id: string) {
    await apiFetch(`/semesters/${id}`, { method: "PUT", body: JSON.stringify({ isCurrent: true }) });
    await load();
  }

  async function deleteSemester(id: string) {
    if (!confirm("Delete this semester?")) return;
    await apiFetch(`/semesters/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/settings" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Semesters</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          <Plus className="w-4 h-4" /> New Semester
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Semester 5 — Fall 2026" required
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="accent-primary" />
            Set as current semester
          </label>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create
          </button>
        </form>
      )}

      <div className="space-y-3">
        {semesters.map((s) => (
          <div key={s.id} className={clsx("bg-surface rounded-xl border p-4 flex items-center justify-between",
            s.isCurrent ? "border-primary" : "border-border"
          )}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.name}</h3>
                {s.isCurrent && <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">Current</span>}
              </div>
              <p className="text-xs text-text-muted mt-1">
                {new Date(s.startDate).toLocaleDateString("en-IN")} — {new Date(s.endDate).toLocaleDateString("en-IN")}
                {s.subjects && ` · ${s.subjects.length} subjects`}
              </p>
            </div>
            <div className="flex gap-2">
              {!s.isCurrent && (
                <button onClick={() => setActive(s.id)} className="p-2 text-text-muted hover:text-primary" title="Set as current">
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => deleteSemester(s.id)} className="p-2 text-text-muted hover:text-danger" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {semesters.length === 0 && (
          <p className="text-center py-8 text-text-muted text-sm">No semesters yet</p>
        )}
      </div>
    </div>
  );
}
