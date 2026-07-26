"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Calendar, Download, Moon, ChevronRight, Trophy, Edit2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiFetch } from "@/hooks/useApi";

const settingsItems = [
  { href: "/settings/notifications", label: "Notifications", desc: "Telegram, email, alarms, and push notifications", icon: Bell, gradient: "from-purple-500 to-pink-500" },
  { href: "/settings/semesters", label: "Semesters", desc: "Manage your semesters and terms", icon: Calendar, gradient: "from-cyan-500 to-blue-500" },
  { href: "/export", label: "Export Data", desc: "Download your attendance as CSV", icon: Download, gradient: "from-green-500 to-emerald-500" },
];

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openEditModal() {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setError("");
    setShowEditModal(true);
  }

  async function handleSaveProfile() {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name: editName, email: editEmail })
      });
      // Force next-auth to update session if possible
      await update({ name: editName, email: editEmail });
      setShowEditModal(false);
      // reload page to ensure new session reflects
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black text-text">Settings</h1>

      {/* Profile card */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-black border-2 border-border-heavy">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black text-text">{user?.name || "Student"}</h2>
              <p className="text-sm font-semibold text-text-secondary">{user?.email}</p>
            </div>
          </div>
          <button onClick={openEditModal} className="btn-ghost p-3 text-text hover:text-primary transition">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings links */}
      <div className="glass rounded-3xl divide-y-2 divide-border-heavy overflow-hidden">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-4 p-5 hover:bg-surface-3 transition">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 border-2 border-border-heavy`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-text">{item.label}</p>
              <p className="text-xs font-semibold text-text-secondary">{item.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </Link>
        ))}
      </div>

      {/* Theme Appearance card */}
      <div className="glass rounded-3xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shrink-0 border-2 border-border-heavy">
            <Moon className="w-5 h-5 text-border-heavy" />
          </div>
          <div>
            <p className="font-black text-text">Appearance</p>
            <p className="text-xs font-semibold text-text-secondary">Toggle between Light and Dark mode</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Achievements link */}
      <Link href="/analytics" className="flex items-center gap-4 glass rounded-3xl p-5 hover:bg-surface-3 transition">
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shrink-0 border-2 border-border-heavy">
          <Trophy className="w-5 h-5 text-border-heavy" />
        </div>
        <div className="flex-1">
          <p className="font-black text-text">Achievements & Badges</p>
          <p className="text-xs font-semibold text-text-secondary">View your earned badges and progress</p>
        </div>
        <ChevronRight className="w-5 h-5 text-text-muted" />
      </Link>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-xl font-black text-text mb-4">Edit Profile</h3>
            {error && <p className="text-red-500 text-xs font-bold bg-red-500/10 p-2 rounded-xl border border-red-500">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-glass w-full py-3" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Email ID</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-glass w-full py-3" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowEditModal(false)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-gradient flex-1 py-3">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
