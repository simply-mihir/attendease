"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Calendar, Download, Moon, ChevronRight, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const settingsItems = [
  { href: "/settings/notifications", label: "Notifications", desc: "Telegram, email, alarms, and push notifications", icon: Bell, gradient: "from-purple-500 to-pink-500" },
  { href: "/settings/semesters", label: "Semesters", desc: "Manage your semesters and terms", icon: Calendar, gradient: "from-cyan-500 to-blue-500" },
  { href: "/export", label: "Export Data", desc: "Download your attendance as CSV", icon: Download, gradient: "from-green-500 to-emerald-500" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gradient">Settings</h1>

      {/* Profile card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">{user?.name || "Student"}</h2>
            <p className="text-sm text-text-secondary">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings links */}
      <div className="glass rounded-2xl divide-y divide-glass-border overflow-hidden">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-4 p-4 hover:bg-white/5 transition">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-text">{item.label}</p>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </Link>
        ))}
      </div>

      {/* Theme Appearance card */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm text-text">Appearance</p>
            <p className="text-xs text-text-secondary">Toggle between Light and Dark mode</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Achievements link */}
      <Link href="/analytics" className="flex items-center gap-4 glass rounded-2xl p-4 hover:bg-white/5 transition">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm text-text">Achievements & Badges</p>
          <p className="text-xs text-text-secondary">View your earned badges and progress</p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted" />
      </Link>
    </div>
  );
}
