"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ProfileProvider } from "@/components/ProfileContext";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnboardingModal } from "@/components/OnboardingModal";
import { NavigationProgress } from "@/components/NavigationProgress";
import {
  GraduationCap, LayoutDashboard, BookOpen, Calendar, BarChart3,
  Sliders, Settings, LogOut, Menu, X, ChevronRight, Zap, TrendingUp, Users, Bell, Award
} from "lucide-react";
import clsx from "clsx";
import { preload } from "swr";
import { apiFetch } from "@/hooks/useApi";

import { SWRPrefetcher } from "@/components/SWRPrefetcher";
import { ReminderNotifier } from "@/components/ReminderNotifier";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { VibrantBackground } from "@/components/VibrantBackground";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, gradient: "from-purple-500 to-pink-500", prefetchKey: "/dashboard" },
  { href: "/semesters", label: "Semesters", icon: GraduationCap, gradient: "from-fuchsia-500 to-purple-500", prefetchKey: "/semesters" },
  { href: "/subjects", label: "Subjects", icon: BookOpen, gradient: "from-cyan-500 to-blue-500", prefetchKey: "/subjects" },
  { href: "/reminders", label: "Reminders", icon: Bell, gradient: "from-amber-500 to-yellow-500", prefetchKey: "/reminders" },
  { href: "/calendar", label: "Calendar", icon: Calendar, gradient: "from-orange-500 to-red-500", prefetchKey: null },
  { href: "/analytics", label: "Analytics", icon: BarChart3, gradient: "from-green-500 to-emerald-500", prefetchKey: "/analytics/dashboard" },
  { href: "/simulator", label: "Simulator", icon: Sliders, gradient: "from-yellow-500 to-orange-500", prefetchKey: null },
  { href: "/optimizer", label: "Skip Optimizer", icon: Zap, gradient: "from-emerald-500 to-cyan-500", prefetchKey: "/analytics/skip-optimizer" },
  { href: "/forecast", label: "Forecast", icon: TrendingUp, gradient: "from-violet-500 to-purple-500", prefetchKey: "/analytics/forecast" },
  { href: "/groups", label: "Friends", icon: Users, gradient: "from-pink-500 to-rose-500", prefetchKey: "/groups" },
  { href: "/achievements", label: "Achievements", icon: Award, gradient: "from-yellow-400 to-orange-500", prefetchKey: null },
  { href: "/settings", label: "Settings", icon: Settings, gradient: "from-pink-500 to-purple-500", prefetchKey: null },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetcher = (url: string) => apiFetch(url);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex h-screen w-full relative z-0 overflow-hidden bg-white dark:bg-[#0a0e1a]">
        <VibrantBackground />
        <FuturisticLoader title="Loading..." Icon={GraduationCap} variant="full" />
      </div>
    );
  }

  const user = session.user;

  return (
    <ProfileProvider>
    <NavigationProgress />
    <SWRPrefetcher />
    <div className="flex min-h-screen relative z-0">
      {/* Vibrant scattered bubbles — covers all pages automatically */}
      <VibrantBackground />
      <OnboardingModal />

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-40 w-[260px] flex flex-col transition-transform lg:translate-x-0 lg:static",
        "bg-gray-50/95 border-r-2 border-gray-200 dark:bg-[#070b14]/95 dark:border-[#2a2a3d] backdrop-blur-sm",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-5 border-b-2 border-gray-200 dark:border-[#2a2a3d]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shadow-[0_3px_0_0_#cc1a5e]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#FF2D78]">AttendEase</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                onMouseEnter={() => item.prefetchKey && preload(item.prefetchKey, fetcher)}
                onTouchStart={() => item.prefetchKey && preload(item.prefetchKey, fetcher)}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                  active
                    ? "bg-[#FF2D78]/10 text-[#FF2D78] shadow-[0_3px_0_0_#fecdd3] dark:shadow-[0_3px_0_0_#3a1020] border border-[#FF2D78]/20"
                    : "text-[#4a4a5a] hover:bg-gray-200/60 hover:text-[#1a1a2e] dark:text-[#6b6b80] dark:hover:bg-white/[0.04] dark:hover:text-white"
                )}>
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  active
                    ? `bg-gradient-to-br ${item.gradient} shadow-sm text-white`
                    : "bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/5"
                )}>
                  <item.icon className={clsx("w-4 h-4", active ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                </div>
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto text-[#FF2D78]" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t-2 border-gray-200 dark:border-[#2a2a3d]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#FF2D78] border border-[#cc1a5e] flex items-center justify-center text-white font-black text-sm shadow-[0_2px_0_0_#cc1a5e]">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-text">{user.name || "Student"}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#4a4a5a] hover:bg-rose-50 hover:text-rose-600 dark:text-[#6b6b80] dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content — transparent bg so bubbles show through */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/60 dark:bg-[#0a0e1a]/60 backdrop-blur-md border-b-2 border-gray-200 dark:border-[#2a2a3d]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-[#4a4a5a] hover:text-[#1a1a2e] dark:text-[#6b6b80] dark:hover:text-white transition lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <ProfileSwitcher />
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-transparent relative">
          <ReminderNotifier />
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ProfileProvider>
  );
}
