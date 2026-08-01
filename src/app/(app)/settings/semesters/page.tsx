"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { ArrowLeft, Plus, Trash2, Star, Loader2, Edit2, BarChart3 , GraduationCap } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

export default function SemestersPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", startDate: "", endDate: "", isCurrent: false });
  
  const [loading, setLoading] = useState(false);

  const { data, isLoading: pageLoading } = useSWRFetch<{ semesters: any[] }>("/semesters");
  const semesters = data?.semesters || [];

  const [linkSemesterId, setLinkSemesterId] = useState<string | null>(null);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());

  async function openLinkModal(semesterId: string) {
    setLoading(true);
    try {
      const data = await apiFetch("/subjects?archived=false");
      setAllSubjects(data.subjects);
      const sem = semesters.find(s => s.id === semesterId);
      const initialIds = new Set(sem?.subjects?.map((sub: any) => sub.id) || []);
      setSelectedSubjectIds(initialIds as Set<string>);
      setLinkSemesterId(semesterId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSubjectSelect(id: string) {
    const next = new Set(selectedSubjectIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSubjectIds(next);
  }

  async function handleLinkSubjects() {
    if (!linkSemesterId) return;
    setLoading(true);
    try {
      const currentSem = semesters.find(s => s.id === linkSemesterId);
      const currentlyLinked = currentSem?.subjects?.map((sub: any) => sub.id) || [];
      const toLink = Array.from(selectedSubjectIds).filter(id => !currentlyLinked.includes(id as string));
      const toUnlink = currentlyLinked.filter((id: string) => !selectedSubjectIds.has(id));

      for (const id of toLink) {
        await apiFetch(`/subjects/${id}`, { method: "PUT", body: JSON.stringify({ semesterId: linkSemesterId }) });
      }
      for (const id of toUnlink) {
        await apiFetch(`/subjects/${id}`, { method: "PUT", body: JSON.stringify({ semesterId: null }) });
      }

      setLinkSemesterId(null);
      await invalidate("/semesters");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/semesters", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", startDate: "", endDate: "", isCurrent: false });
      setShowForm(false);
      await invalidate("/semesters");
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
      await invalidate("/semesters");
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function setActive(id: string) {
    await apiFetch(`/semesters/${id}`, { method: "PUT", body: JSON.stringify({ isCurrent: true }) });
    await invalidate("/semesters");
  }

  async function deleteSemester(id: string) {
    if (!confirm("Delete this semester?")) return;
    await apiFetch(`/semesters/${id}`, { method: "DELETE" });
    await invalidate("/semesters");
  }

  if (pageLoading) {
    return <FuturisticLoader variant="section" title="Loading semesters" Icon={GraduationCap} />;
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto space-y-6">
      <Link href="/settings" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <div className="flex items-center justify-between" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 50ms forwards" }}>
        <h1 className="text-2xl font-black text-text">Semesters</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-gradient flex items-center gap-2 px-6 py-3">
          <Plus className="w-4 h-4" /> New Semester
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass rounded-3xl p-6 space-y-4 animate-fade-in">
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

      <StaggerGrid className="space-y-3" delay={150} staggerDelay={80} animation="fadeSlideUp">
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
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href={`/semesters/${s.id}/dashboard`} className="btn-ghost px-3 py-1.5 text-xs text-text-secondary hover:text-white rounded-lg border border-glass-border transition flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button onClick={() => openLinkModal(s.id)} className="btn-ghost px-3 py-1.5 text-xs text-text-secondary hover:text-text rounded-lg border border-glass-border transition">
                  Link Subjects
                </button>
                <Link href={`/subjects/new?semesterId=${s.id}`} className="btn-ghost px-3 py-1.5 text-xs text-primary hover:text-purple-400 rounded-lg border border-primary/20 transition">
                  + New Subject
                </Link>
              </div>
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
      </StaggerGrid>

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

      {/* Link Subjects Modal */}
      {linkSemesterId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
            <h3 className="text-xl font-black text-text mb-4">Link Existing Subjects</h3>
            <p className="text-sm text-text-secondary mb-4">Select subjects to associate with this semester.</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4">
              {allSubjects.map(sub => (
                <label key={sub.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer border border-transparent hover:border-white/10">
                  <input 
                    type="checkbox" 
                    checked={selectedSubjectIds.has(sub.id)}
                    onChange={() => toggleSubjectSelect(sub.id)}
                    className="accent-primary w-5 h-5 rounded" 
                  />
                  <div>
                    <p className="font-semibold text-text">{sub.name}</p>
                    <p className="text-xs text-text-muted">{sub.code || "No code"} {sub.semester?.name ? `· Currently in ${sub.semester.name}` : "· Unassigned"}</p>
                  </div>
                </label>
              ))}
              {allSubjects.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">No subjects exist yet.</p>
              )}
            </div>

            <div className="flex gap-3 mt-auto pt-4 border-t border-glass-border">
              <button type="button" onClick={() => setLinkSemesterId(null)} className="btn-ghost flex-1 py-3 rounded-xl font-bold text-sm">Cancel</button>
              <button type="button" onClick={handleLinkSubjects} disabled={loading} className="btn-gradient flex-1 py-3 rounded-xl font-bold text-sm">
                {loading ? "Saving..." : "Save Selection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
