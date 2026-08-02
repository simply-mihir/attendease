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
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>Settings</h1>

      <StaggerGrid className="space-y-6" delay={100} staggerDelay={100} animation="fadeSlideUp">
        {/* Profile card */}
        <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shadow-violet-500/25">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name || "Student"}</h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button onClick={openEditModal} className="p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-violet-400 transition cursor-pointer">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings links */}
        <div className="rounded-3xl bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl divide-y divide-gray-100 dark:divide-white/5 overflow-hidden transition-all">
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 shadow-md shadow-violet-500/10`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">{item.label}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:translate-x-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all" />
            </Link>
          ))}
        </div>

        {/* Theme Appearance card */}
        <div className="rounded-3xl p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Appearance</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Toggle between Light and Dark mode</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Achievements link */}
        <Link href="/analytics" className="flex items-center gap-4 rounded-3xl p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-white/5 transition block group">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">Achievements & Badges</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">View your earned badges and progress</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:translate-x-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-all" />
        </Link>
      </StaggerGrid>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-white/10 dark:backdrop-blur-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Edit Profile</h3>
            {error && <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email ID</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowEditModal(false)} className="rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 flex-1 transition cursor-pointer">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold flex-1 py-2.5 text-sm shadow-md shadow-violet-500/20 hover:shadow-lg transition cursor-pointer">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
