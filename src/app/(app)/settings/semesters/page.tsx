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
      <Link href="/settings" className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">Semesters</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New Semester
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass rounded-2xl p-5 space-y-4">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Semester 5 — Fall 2026" required
            className="input-glass w-full px-4 py-2.5 rounded-xl text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                className="input-glass w-full px-4 py-2.5 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
                className="input-glass w-full px-4 py-2.5 rounded-xl text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="accent-purple-500" />
            Set as current semester
          </label>
          <button type="submit" disabled={loading}
            className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create
          </button>
        </form>
      )}

      <div className="space-y-3">
        {semesters.map((s) => (
          <div key={s.id} className={clsx("glass rounded-2xl p-4 flex items-center justify-between",
            s.isCurrent ? "border-purple-500/50 shadow-lg shadow-purple-500/10" : ""
          )}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{s.name}</h3>
                {s.isCurrent && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">Current</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(s.startDate).toLocaleDateString("en-IN")} — {new Date(s.endDate).toLocaleDateString("en-IN")}
                {s.subjects && ` · ${s.subjects.length} subjects`}
              </p>
            </div>
            <div className="flex gap-2">
              {!s.isCurrent && (
                <button onClick={() => setActive(s.id)} className="p-2 text-gray-500 hover:text-purple-400 transition" title="Set as current">
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => deleteSemester(s.id)} className="p-2 text-gray-500 hover:text-red-400 transition" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {semesters.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No semesters yet</p>
        )}
      </div>
    </div>
  );
}
