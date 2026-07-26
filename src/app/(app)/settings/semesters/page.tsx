"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { ArrowLeft, Plus, Trash2, Star, Loader2, Edit2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", startDate: "", endDate: "", isCurrent: false });
  
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

  function openEditModal(semester: any) {
    setEditForm({
      id: semester.id,
      name: semester.name,
      startDate: new Date(semester.startDate).toISOString().slice(0, 10),
      endDate: new Date(semester.endDate).toISOString().slice(0, 10),
      isCurrent: semester.isCurrent
    });
    setShowEditModal(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/semesters/${editForm.id}`, { method: "PUT", body: JSON.stringify(editForm) });
      setShowEditModal(false);
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
        <h1 className="text-2xl font-black text-text">Semesters</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-gradient flex items-center gap-2 px-6 py-3">
          <Plus className="w-4 h-4" /> New Semester
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass rounded-3xl p-6 space-y-4">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Semester 5 — Fall 2026" required
            className="input-glass w-full py-3" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                className="input-glass w-full py-3" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
                className="input-glass w-full py-3" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-text">
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="accent-primary w-4 h-4" />
            Set as current semester
          </label>
          <button type="submit" disabled={loading}
            className="btn-gradient px-6 py-3 w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create Semester
          </button>
        </form>
      )}

      <div className="space-y-3">
        {semesters.map((s) => (
          <div key={s.id} className={clsx("glass p-5 flex items-center justify-between",
            s.isCurrent ? "border-primary shadow-lg" : ""
          )}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-text">{s.name}</h3>
                {s.isCurrent && <span className="px-3 py-1 bg-primary text-white text-xs rounded-full font-black uppercase">Current</span>}
              </div>
              <p className="text-xs font-bold text-text-muted mt-1">
                {new Date(s.startDate).toLocaleDateString("en-IN")} — {new Date(s.endDate).toLocaleDateString("en-IN")}
                {s.subjects && ` · ${s.subjects.length} subjects`}
              </p>
            </div>
            <div className="flex gap-2">
              {!s.isCurrent && (
                <button onClick={() => setActive(s.id)} className="btn-ghost p-3 text-text-muted hover:text-yellow-500 transition" title="Set as current">
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => openEditModal(s)} className="btn-ghost p-3 text-text-muted hover:text-primary transition" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteSemester(s.id)} className="btn-ghost p-3 text-text-muted hover:text-red-500 transition" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {semesters.length === 0 && (
          <p className="text-center py-8 text-text-muted text-sm font-bold">No semesters yet</p>
        )}
      </div>

      {/* Edit Semester Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleEdit} className="glass-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-xl font-black text-text mb-4">Edit Semester</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required className="input-glass w-full py-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Start Date</label>
                  <input type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} required className="input-glass w-full py-3" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">End Date</label>
                  <input type="date" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} required className="input-glass w-full py-3" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-text">
                <input type="checkbox" checked={editForm.isCurrent} onChange={e => setEditForm({ ...editForm, isCurrent: e.target.checked })} className="accent-primary w-4 h-4" />
                Set as current semester
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button type="submit" disabled={loading} className="btn-gradient flex-1 py-3">{loading ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
