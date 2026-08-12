"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Calendar, Download, Moon, ChevronRight, Trophy, Edit2, HeartPulse, Target } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar, AvatarPicker } from "@/components/UserAvatar";
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
  const [editImage, setEditImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openEditModal() {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setEditImage(user?.image || null);
    setError("");
    setShowEditModal(true);
  }

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("edit") === "true") {
        openEditModal();
        // Remove the query param so it doesn't reopen on refresh
        window.history.replaceState({}, '', '/settings');
      }
    }
  }, [user]);

  async function handleSaveProfile() {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name: editName, email: editEmail, image: editImage })
      });
      await update({ name: editName, email: editEmail });
      setShowEditModal(false);
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
        <div className="rounded-2xl border-2 border-[#FF2D78] p-5 mb-4 bg-[#FF2D78]/10 shadow-[0_6px_0_0_#cc1a5e] dark:bg-[#FF2D78]/15 dark:shadow-[0_6px_0_0_#b81e56]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar user={user || {}} size="lg" className="shadow-[0_4px_0_0_#cc1a5e]" />
              <div>
                <h2 className="text-lg font-black text-text">{user?.name || "Student"}</h2>
                <p className="text-sm font-bold text-text-muted">{user?.email}</p>
              </div>
            </div>
            <button onClick={openEditModal} className="flex items-center justify-center rounded-xl border-2 p-3 transition-all duration-150 cursor-pointer border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a]">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications — Orange outline */}
        <Link href="/settings/notifications" className="block rounded-2xl border-2 border-[#ff6b35] p-4 mb-4 cursor-pointer transition-all duration-150 bg-[#ff6b35]/10 shadow-[0_4px_0_0_#cc5529] dark:bg-[#ff6b35]/15 dark:shadow-[0_4px_0_0_#a34421] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#cc5529] dark:hover:shadow-[0_3px_0_0_#a34421] group">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35] shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#1a1a2e] dark:text-white group-hover:text-[#ff6b35] transition-colors">Notifications</p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80]">Telegram, email, alarms, and push notifications</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#ff6b35]/40 group-hover:translate-x-1 group-hover:text-[#ff6b35] transition-all" />
          </div>
        </Link>

        {/* Semesters — Teal outline */}
        <Link href="/settings/semesters" className="block rounded-2xl border-2 border-[#06d6a0] p-4 mb-4 cursor-pointer transition-all duration-150 bg-[#06d6a0]/10 shadow-[0_4px_0_0_#05a87e] dark:bg-[#06d6a0]/15 dark:shadow-[0_4px_0_0_#049e77] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#05a87e] dark:hover:shadow-[0_3px_0_0_#049e77] group">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06d6a0]/15 text-[#06d6a0] shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#1a1a2e] dark:text-white group-hover:text-[#06d6a0] transition-colors">Semesters</p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80]">Manage your semesters and terms</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#06d6a0]/40 group-hover:translate-x-1 group-hover:text-[#06d6a0] transition-all" />
          </div>
        </Link>

        {/* Export Data — Blue outline */}
        <Link href="/export" className="block rounded-2xl border-2 border-[#4361ee] p-4 mb-4 cursor-pointer transition-all duration-150 bg-[#4361ee]/10 shadow-[0_4px_0_0_#3451cc] dark:bg-[#4361ee]/15 dark:shadow-[0_4px_0_0_#2a41a3] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#3451cc] dark:hover:shadow-[0_3px_0_0_#2a41a3] group">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4361ee]/15 text-[#4361ee] shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#1a1a2e] dark:text-white group-hover:text-[#4361ee] transition-colors">Export Data</p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80]">Download your attendance as CSV</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#4361ee]/40 group-hover:translate-x-1 group-hover:text-[#4361ee] transition-all" />
          </div>
        </Link>

        {/* Medical Leave — Coral outline */}
        <Link href="/medical-leave" className="block rounded-2xl border-2 border-[#ef476f] p-4 mb-4 cursor-pointer transition-all duration-150 bg-[#ef476f]/10 shadow-[0_4px_0_0_#c43559] dark:bg-[#ef476f]/15 dark:shadow-[0_4px_0_0_#9e2a47] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#c43559] dark:hover:shadow-[0_3px_0_0_#9e2a47] group">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ef476f]/15 text-[#ef476f] shrink-0">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#1a1a2e] dark:text-white group-hover:text-[#ef476f] transition-colors">Medical Leave</p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80]">Bulk mark dates as excused</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#ef476f]/40 group-hover:translate-x-1 group-hover:text-[#ef476f] transition-all" />
          </div>
        </Link>

        {/* Goal Mode — Cyan outline */}
        <Link href="/settings/goal" className="block rounded-2xl border-2 border-[#4cc9f0] p-4 mb-4 cursor-pointer transition-all duration-150 bg-[#4cc9f0]/10 shadow-[0_4px_0_0_#3aa3c4] dark:bg-[#4cc9f0]/15 dark:shadow-[0_4px_0_0_#2e829d] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#3aa3c4] dark:hover:shadow-[0_3px_0_0_#2e829d] group">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4cc9f0]/15 text-[#4cc9f0] shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#1a1a2e] dark:text-white group-hover:text-[#4cc9f0] transition-colors">Goal Mode</p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80]">Set your attendance target</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#4cc9f0]/40 group-hover:translate-x-1 group-hover:text-[#4cc9f0] transition-all" />
          </div>
        </Link>

        {/* Theme Appearance card */}
        <div className="rounded-2xl border-2 border-[#9b5de5] p-5 mb-4 bg-[#9b5de5]/10 shadow-[0_6px_0_0_#7c4ab8] dark:bg-[#9b5de5]/15 dark:shadow-[0_6px_0_0_#5a3589] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9b5de5]/15 text-[#9b5de5] flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[#1a1a2e] dark:text-white">Appearance</p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">Toggle between Light and Dark mode</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Achievements link */}
        <Link href="/analytics" className="group rounded-2xl border-2 border-[#FFD166] p-5 cursor-pointer transition-all duration-150 bg-[#FFD166]/10 shadow-[0_6px_0_0_#ccaa52] dark:bg-[#FFD166]/15 dark:shadow-[0_6px_0_0_#a38842] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#ccaa52] dark:hover:shadow-[0_4px_0_0_#a38842] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFD166]/15 text-[#FFD166] flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#1a1a2e] dark:text-white group-hover:text-[#FFD166] transition">Achievements & Badges</p>
            <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">View your earned badges and progress</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#FFD166]/40 group-hover:translate-x-1 group-hover:text-[#FFD166] transition-all" />
        </Link>
      </StaggerGrid>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="rounded-2xl border-2 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in space-y-4 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]">
            <h3 className="text-xl font-black text-text mb-2">Edit Profile</h3>
            {error && <p className="text-[#ef476f] text-xs font-bold bg-[#ef476f]/10 p-2.5 rounded-xl border-2 border-[#ef476f]/30">{error}</p>}
            <div className="space-y-3">
              {/* Avatar preview + picker */}
              <div className="flex flex-col items-center gap-3 pb-2">
                <UserAvatar user={{ ...user, image: editImage }} size="xl" className="shadow-[0_4px_0_0_#cc1a5e]" />
              </div>
              <AvatarPicker
                seed={user?.email || user?.name || "default"}
                currentImage={editImage}
                onSelect={(url) => setEditImage(url)}
              />
              <div>
                <label className="block text-xs font-black text-text mb-1">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 border-gray-200 bg-white text-[#1a1a2e] shadow-[0_3px_0_0_#d1d5db] focus:border-[#4361ee] focus:outline-none focus:ring-4 focus:ring-[#4361ee]/20 dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-white dark:shadow-[0_3px_0_0_#0d0d1a] dark:focus:border-[#4361ee]" />
              </div>
              <div>
                <label className="block text-xs font-black text-text mb-1">Email ID</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 border-gray-200 bg-white text-[#1a1a2e] shadow-[0_3px_0_0_#d1d5db] focus:border-[#4361ee] focus:outline-none focus:ring-4 focus:ring-[#4361ee]/20 dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-white dark:shadow-[0_3px_0_0_#0d0d1a] dark:focus:border-[#4361ee]" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowEditModal(false)} className="flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a]">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer border-[#304bc9] bg-[#4361ee] text-white shadow-[0_3px_0_0_#304bc9] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#304bc9] disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
