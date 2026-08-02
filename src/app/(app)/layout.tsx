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
  Sliders, Settings, LogOut, Menu, X, ChevronRight, ChevronLeft, Zap, TrendingUp, Users, Bell, Award
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSidebarCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0a0e1a] overflow-hidden">
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
        "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static",
        "bg-gray-50/95 border-r-2 border-gray-200 dark:bg-[#070b14]/95 dark:border-[#2a2a3d] backdrop-blur-sm",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "w-[260px] lg:w-[88px]" : "w-[260px]"
      )}>
        <div className={clsx("flex items-center px-5 py-5 border-b-2 border-gray-200 dark:border-[#2a2a3d] relative", sidebarCollapsed ? "lg:justify-center" : "justify-between")}>
          <Link href="/dashboard" className={clsx("flex items-center gap-2.5", sidebarCollapsed ? "lg:hidden" : "")}>
            <div className="w-9 h-9 rounded-xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#cc1a5e]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#FF2D78]">AttendEase</span>
          </Link>
          {sidebarCollapsed && (
            <Link href="/dashboard" className="hidden lg:flex items-center justify-center">
              <div className="w-9 h-9 rounded-xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#cc1a5e]">
                <span className="font-extrabold text-white">A</span>
              </div>
            </Link>
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className={clsx(
            "hidden lg:flex my-3 h-9 w-9 items-center justify-center rounded-xl",
            "border-2 border-[#FF2D78]/30 bg-[#FF2D78]/10 text-[#FF2D78]",
            "shadow-[0_3px_0_0_rgba(255,45,120,0.2)]",
            "hover:translate-y-[1px] hover:shadow-[0_2px_0_0_rgba(255,45,120,0.2)]",
            "transition-all duration-150",
            sidebarCollapsed ? "mx-auto" : "ml-3"
          )}
          style={{ animation: "sidebarTogglePulse 2s ease-in-out infinite" }}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className={clsx("flex-1 py-2 overflow-y-auto space-y-1.5", sidebarCollapsed ? "px-2 lg:px-3" : "px-3")}>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                onMouseEnter={() => item.prefetchKey && preload(item.prefetchKey, fetcher)}
                onTouchStart={() => item.prefetchKey && preload(item.prefetchKey, fetcher)}
                title={sidebarCollapsed ? item.label : undefined}
                className={clsx(
                  "flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                  sidebarCollapsed ? "px-0 lg:justify-center" : "px-3.5",
                  active
                    ? "bg-[#FF2D78]/10 text-[#FF2D78] shadow-[0_3px_0_0_#fecdd3] dark:shadow-[0_3px_0_0_#3a1020] border border-[#FF2D78]/20"
                    : "text-[#4a4a5a] hover:bg-gray-200/60 hover:text-[#1a1a2e] dark:text-[#6b6b80] dark:hover:bg-white/[0.04] dark:hover:text-white"
                )}>
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  active
                    ? `bg-gradient-to-br ${item.gradient} shadow-sm text-white`
                    : "bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/5"
                )}>
                  <item.icon className={clsx("w-4 h-4", active ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                </div>
                {!sidebarCollapsed && <span>{item.label}</span>}
                <span className={clsx("lg:hidden", sidebarCollapsed ? "hidden" : "")}>{item.label}</span>
                {!sidebarCollapsed && active && <ChevronRight className="w-4 h-4 ml-auto text-[#FF2D78] shrink-0" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t-2 border-gray-200 dark:border-[#2a2a3d]">
          {sidebarCollapsed ? (
            <div className="hidden lg:flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FF2D78] border border-[#cc1a5e] flex items-center justify-center text-white font-black text-sm shadow-[0_2px_0_0_#cc1a5e] shrink-0" title={user.name || user.email || ""}>
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:text-gray-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition cursor-pointer" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
          
          <div className={clsx(sidebarCollapsed ? "lg:hidden block" : "block")}>
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#FF2D78] border border-[#cc1a5e] flex items-center justify-center text-white font-black text-sm shadow-[0_2px_0_0_#cc1a5e] shrink-0">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-text">{user.name || "Student"}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#4a4a5a] hover:bg-rose-50 hover:text-rose-600 dark:text-[#6b6b80] dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition cursor-pointer">
              <LogOut className="w-4 h-4 shrink-0" /> Sign out
            </button>
          </div>
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
