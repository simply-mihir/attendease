"use client";
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/hooks/useApi";
import { useProfiles } from "./ProfileContext";
import { GraduationCap, ChevronDown, Plus, Check, Loader2, X, Building2, BookOpen, Calendar, UserCheck } from "lucide-react";
import clsx from "clsx";

export function ProfileSwitcher() {
  const { profiles, loading, currentProfile, reloadProfiles } = useProfiles();
  const [open, setOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newProfileName, setNewProfileName] = useState("");
  const [newInstitution, setNewInstitution] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newSemesterName, setNewSemesterName] = useState("Semester 1");
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  async function switchProfile(id: string) {
    setOpen(false);
    await apiFetch(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isCurrent: true }),
    });
    await reloadProfiles();
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!newProfileName.trim() || !newCourseName.trim() || !newInstitution.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: newProfileName,
          degreeType: newCourseName,
          institution: newInstitution,
          semesterName: newSemesterName || "Semester 1",
          isCurrent: true,
        }),
      });
      setNewProfileName("");
      setNewInstitution("");
      setNewCourseName("");
      setNewSemesterName("Semester 1");
      setShowAddModal(false);
      await reloadProfiles();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  // Show a stable placeholder while loading, never return null to prevent layout shift
  if (loading || profiles.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-transparent opacity-0 pointer-events-none select-none">
        <div className="w-5 h-5" />
        <span>Loading...</span>
        <div className="w-3.5 h-3.5" />
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#141425] dark:hover:bg-[#1a1a2e] border-2 border-gray-200 dark:border-[#2a2a3d] shadow-[0_3px_0_0_#d1d5db] dark:shadow-[0_3px_0_0_#0d0d1a] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#d1d5db] dark:hover:shadow-[0_2px_0_0_#0d0d1a] active:translate-y-[2px] active:shadow-[0_1px_0_0_#d1d5db] text-xs font-bold select-none cursor-pointer transition-all"
      >
        <div className="w-5 h-5 rounded-lg bg-[#FF2D78] border border-[#cc1a5e] flex items-center justify-center text-white shrink-0 shadow-sm">
          <GraduationCap className="w-3 h-3" />
        </div>
        <span className="max-w-[90px] sm:max-w-[130px] truncate text-[#1a1a2e] dark:text-white">
          {currentProfile?.name || "Select Profile"}
        </span>
        <ChevronDown className={clsx("w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 mt-2 w-64 rounded-2xl p-2 z-50 shadow-[0_8px_0_0_#d1d5db] dark:shadow-[0_8px_0_0_#0d0d1a] space-y-1 bg-white border-2 border-gray-200 dark:bg-[#141425] dark:border-[#2a2a3d]"
          style={{ animation: "dropdown-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          <style>{`
            @keyframes dropdown-in {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Degree Profiles
          </div>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => switchProfile(p.id)}
              className={clsx(
                "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all",
                p.isCurrent
                  ? "bg-[#FF2D78]/10 text-[#FF2D78] border border-[#FF2D78]/30 shadow-[0_2px_0_0_#fecdd3] dark:shadow-[0_2px_0_0_#3a1020]"
                  : "hover:bg-gray-100 text-[#4a4a5a] dark:hover:bg-white/5 dark:text-[#c4c4d4]"
              )}
            >
              <div className="truncate pr-2">
                <p className="font-bold text-[#1a1a2e] dark:text-white truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{p.degreeType}{p.institution ? ` · ${p.institution}` : ""}</p>
              </div>
              {p.isCurrent && <Check className="w-4 h-4 text-[#FF2D78] shrink-0" />}
            </button>
          ))}

          <button
            onClick={() => { setOpen(false); setShowAddModal(true); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-[#FF2D78] hover:bg-[#FF2D78]/10 transition-colors duration-150 mt-1 border-2 border-dashed border-[#FF2D78]/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Degree Profile
          </button>
        </div>
      )}

      {/* Add Profile Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            animation: "onboard-in 0.25s ease-out forwards",
          }}
        >
          <style>{`
            @keyframes onboard-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modal-up { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>

          <div
            className="rounded-3xl p-6 max-w-md w-full shadow-[0_12px_0_0_#d1d5db] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4 bg-white border-2 border-gray-200 dark:bg-[#141425] dark:border-[#2a2a3d]"
            style={{ animation: "modal-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1a1a2e] dark:text-white">Add New Degree Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4a4a5a] dark:text-[#c4c4d4] mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#FF2D78]" /> Profile Name
                </label>
                <input type="text" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Minor in Economics, B.Tech Profile" required className="input-3d w-full px-3.5 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4a4a5a] dark:text-[#c4c4d4] mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#ff6b35]" /> College Name
                </label>
                <input type="text" value={newInstitution} onChange={(e) => setNewInstitution(e.target.value)}
                  placeholder="e.g. IIT Bombay, Delhi University" required className="input-3d w-full px-3.5 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4a4a5a] dark:text-[#c4c4d4] mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#06d6a0]" /> Course Pursuing
                </label>
                <input type="text" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. B.Tech CS, B.Com (Hons)" required className="input-3d w-full px-3.5 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4a4a5a] dark:text-[#c4c4d4] mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4361ee]" /> Semester
                </label>
                <select value={newSemesterName} onChange={(e) => setNewSemesterName(e.target.value)}
                  className="input-3d w-full px-3.5 py-2 rounded-xl text-sm">
                  {["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8", "Semester 9", "Semester 10"].map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-3d-ghost flex-1 py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="btn-3d-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Switch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
