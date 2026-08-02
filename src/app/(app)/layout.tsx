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
  Sliders, Settings, LogOut, Menu, X, ChevronRight, Zap, TrendingUp, Users, Bell
} from "lucide-react";
import clsx from "clsx";
import { preload } from "swr";
import { apiFetch } from "@/hooks/useApi";

import { SWRPrefetcher } from "@/components/SWRPrefetcher";
import { ReminderNotifier } from "@/components/ReminderNotifier";
import { FuturisticLoader } from "@/components/FuturisticLoader";

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
    return <FuturisticLoader title="Loading..." Icon={GraduationCap} variant="full" />;
  }

  const user = session.user;

  return (
    <ProfileProvider>
    <NavigationProgress />
    <SWRPrefetcher />
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <OnboardingModal />

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-40 w-[280px] flex flex-col transition-transform lg:translate-x-0 lg:static",
        "bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">AttendEase</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                onMouseEnter={() => item.prefetchKey && preload(item.prefetchKey, fetcher)}
                onTouchStart={() => item.prefetchKey && preload(item.prefetchKey, fetcher)}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                )}>
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  active
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                    : "bg-gray-100 dark:bg-white/5"
                )}>
                  <item.icon className={clsx("w-4 h-4", active ? "text-white" : "text-gray-400 dark:text-gray-500")} />
                </div>
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto text-purple-500 dark:text-purple-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{user.name || "Student"}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <ProfileSwitcher />
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
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
