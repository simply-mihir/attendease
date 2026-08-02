"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Calendar, Download, Moon, ChevronRight, Trophy, Edit2, HeartPulse, Target } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiFetch } from "@/hooks/useApi";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

const settingsItems = [
  { href: "/settings/notifications", label: "Notifications", desc: "Telegram, email, alarms, and push notifications", icon: Bell, gradient: "from-purple-500 to-pink-500" },
  { href: "/settings/semesters", label: "Semesters", desc: "Manage your semesters and terms", icon: Calendar, gradient: "from-cyan-500 to-blue-500" },
  { href: "/export", label: "Export Data", desc: "Download your attendance as CSV", icon: Download, gradient: "from-green-500 to-emerald-500" },
  { href: "/medical-leave", label: "Medical Leave", desc: "Bulk mark dates as excused", icon: HeartPulse, gradient: "from-red-500 to-pink-500" },
  { href: "/settings/goal", label: "Goal Mode", desc: "Set your attendance target", icon: Target, gradient: "from-amber-500 to-orange-500" },
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
    <PageTransition direction="up" staggerChildren={false} className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>Settings</h1>

      <StaggerGrid className="space-y-6" delay={100} staggerDelay={100} animation="fadeSlideUp">
        {/* Profile card */}
        <div className="card-3d p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FF2D78] border-2 border-[#d61b60] flex items-center justify-center text-white text-2xl font-black shadow-[0_4px_0_0_#d61b60]">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-black text-text">{user?.name || "Student"}</h2>
                <p className="text-sm font-bold text-text-muted">{user?.email}</p>
              </div>
            </div>
            <button onClick={openEditModal} className="btn-3d-secondary p-3 cursor-pointer">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings links */}
        <div className="card-3d p-2 divide-y-2 divide-gray-100 dark:divide-[#2a2a3d] overflow-hidden">
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1f1f35] rounded-2xl transition group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 border-2 border-white/20 shadow-[0_3px_0_0_rgba(0,0,0,0.2)]`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-text group-hover:text-[#FF2D78] transition">{item.label}</p>
                <p className="text-xs font-bold text-text-muted mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-1 group-hover:text-[#FF2D78] transition-all" />
            </Link>
          ))}
        </div>

        {/* Theme Appearance card */}
        <div className="card-3d p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7b2cbf]/15 text-[#7b2cbf] dark:text-[#c77dff] border-2 border-[#7b2cbf]/30 flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#7b2cbf]">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-text">Appearance</p>
              <p className="text-xs font-bold text-text-muted mt-0.5">Toggle between Light and Dark mode</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Achievements link */}
        <Link href="/analytics" className="card-3d p-5 flex items-center gap-4 hover:border-[#ffbe0b] transition block group">
          <div className="w-12 h-12 rounded-2xl bg-[#ffbe0b]/20 text-[#b58100] dark:text-[#ffbe0b] border-2 border-[#ffbe0b]/40 flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#ffbe0b]">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-black text-text group-hover:text-[#ffbe0b] transition">Achievements & Badges</p>
            <p className="text-xs font-bold text-text-muted mt-0.5">View your earned badges and progress</p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-1 group-hover:text-[#ffbe0b] transition-all" />
        </Link>
      </StaggerGrid>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="card-3d p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-xl font-black text-text mb-2">Edit Profile</h3>
            {error && <p className="text-[#ef476f] text-xs font-bold bg-[#ef476f]/10 p-2.5 rounded-xl border-2 border-[#ef476f]/30">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-text mb-1">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-3d" />
              </div>
              <div>
                <label className="block text-xs font-black text-text mb-1">Email ID</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-3d" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowEditModal(false)} className="btn-3d-secondary flex-1 py-2.5 text-sm font-black cursor-pointer">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-3d-primary flex-1 py-2.5 text-sm font-black cursor-pointer">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
