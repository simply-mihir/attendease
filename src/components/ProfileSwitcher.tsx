"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/hooks/useApi";
import { GraduationCap, ChevronDown, Plus, Check, Loader2, X } from "lucide-react";
import clsx from "clsx";

export function ProfileSwitcher() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newDegreeType, setNewDegreeType] = useState("");
  const [creating, setCreating] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      const res = await apiFetch("/profiles");
      setProfiles(res.profiles || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const currentProfile = profiles.find((p) => p.isCurrent) || profiles[0];

  async function switchProfile(id: string) {
    try {
      await apiFetch(`/profiles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isCurrent: true }),
      });
      await loadProfiles();
      setOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/profiles", {
        method: "POST",
        body: JSON.stringify({ name: newProfileName, degreeType: newDegreeType, isCurrent: true }),
      });
      setNewProfileName("");
      setNewDegreeType("");
      setShowAddModal(false);
      await loadProfiles();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass hover:bg-glass-strong transition text-xs font-medium border border-glass-border"
      >
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0">
          <GraduationCap className="w-3 h-3" />
        </div>
        <span className="max-w-[120px] truncate text-text">
          {currentProfile?.name || "Main Degree"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 glass-strong rounded-2xl p-2 z-50 shadow-2xl space-y-1 animate-fade-in border border-glass-border">
            <div className="px-3 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Degree Profiles
            </div>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => switchProfile(p.id)}
                className={clsx(
                  "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition text-left",
                  p.isCurrent ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" : "hover:bg-white/5 text-text-secondary"
                )}
              >
                <div>
                  <p className="font-semibold text-text">{p.name}</p>
                  {p.degreeType && <p className="text-[10px] text-text-muted">{p.degreeType}</p>}
                </div>
                {p.isCurrent && <Check className="w-4 h-4 text-purple-400" />}
              </button>
            ))}

            <button
              onClick={() => { setOpen(false); setShowAddModal(true); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition mt-1 border border-purple-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Degree / Profile
            </button>
          </div>
        </>
      )}

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gradient">Add Degree Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Profile / Degree Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Minor in Economics, B.Tech CS"
                  required
                  className="input-glass w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Degree Type (Optional)</label>
                <input
                  type="text"
                  value={newDegreeType}
                  onChange={(e) => setNewDegreeType(e.target.value)}
                  placeholder="e.g. Bachelor of Science"
                  className="input-glass w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost flex-1 py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-gradient flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
