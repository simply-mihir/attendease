"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Bell, Calendar, Download, User, Moon, ChevronRight, Trophy } from "lucide-react";

const settingsItems = [
  { href: "/settings/notifications", label: "Notifications", desc: "WhatsApp, alarms, and push notification settings", icon: Bell },
  { href: "/settings/semesters", label: "Semesters", desc: "Manage your semesters and terms", icon: Calendar },
  { href: "/export", label: "Export Data", desc: "Download your attendance as CSV", icon: Download },
];

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile card */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.fullName}</h2>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            <p className="text-xs text-text-muted mt-1">Timezone: {user?.timezone}</p>
          </div>
        </div>
      </div>

      {/* Settings links */}
      <div className="bg-surface rounded-xl border border-border divide-y divide-border">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-4 p-4 hover:bg-surface-2 transition">
            <item.icon className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </Link>
        ))}
      </div>

      {/* Theme (simplified) */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center gap-3">
          <Moon className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-sm">Appearance</p>
            <p className="text-xs text-text-muted">Follows your system theme</p>
          </div>
        </div>
      </div>

      {/* Achievements link */}
      <Link href="/analytics" className="flex items-center gap-4 bg-surface rounded-xl border border-border p-4 hover:bg-surface-2 transition">
        <Trophy className="w-5 h-5 text-warning" />
        <div className="flex-1">
          <p className="font-medium text-sm">Achievements & Badges</p>
          <p className="text-xs text-text-muted">View your earned badges and progress</p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted" />
      </Link>
    </div>
  );
}
