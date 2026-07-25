"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Bell, Calendar, Download, User, Moon, ChevronRight, Trophy } from "lucide-react";

const settingsItems = [
  { href: "/settings/notifications", label: "Notifications", desc: "WhatsApp, alarms, and push notification settings", icon: Bell, gradient: "from-purple-500 to-pink-500" },
  { href: "/settings/semesters", label: "Semesters", desc: "Manage your semesters and terms", icon: Calendar, gradient: "from-cyan-500 to-blue-500" },
  { href: "/export", label: "Export Data", desc: "Download your attendance as CSV", icon: Download, gradient: "from-green-500 to-emerald-500" },
];

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gradient">Settings</h1>

      {/* Profile card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.fullName}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">Timezone: {user?.timezone}</p>
          </div>
        </div>
      </div>

      {/* Settings links */}
      <div className="glass rounded-2xl divide-y divide-white/10">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-4 p-4 hover:bg-white/5 transition first:rounded-t-2xl last:rounded-b-2xl">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </Link>
        ))}
      </div>

      {/* Theme (simplified) */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-white">Appearance</p>
            <p className="text-xs text-gray-500">Follows your system theme</p>
          </div>
        </div>
      </div>

      {/* Achievements link */}
      <Link href="/analytics" className="flex items-center gap-4 glass rounded-2xl p-4 hover:bg-white/5 transition">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm text-white">Achievements & Badges</p>
          <p className="text-xs text-gray-500">View your earned badges and progress</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </Link>
    </div>
  );
}
