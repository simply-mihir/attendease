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
  Sliders, Settings, LogOut, Menu, X, ChevronRight, ChevronLeft, Zap, TrendingUp, Users, Bell, Award, Loader2
} from "lucide-react";
import clsx from "clsx";
import { UserAvatar } from "@/components/UserAvatar";
import { preload } from "swr";
import { apiFetch } from "@/hooks/useApi";

import { SWRPrefetcher } from "@/components/SWRPrefetcher";
import { ReminderNotifier } from "@/components/ReminderNotifier";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { VibrantBackground } from "@/components/VibrantBackground";
import { ScheduleChatbot } from "@/components/ScheduleChatbot";

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
];const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "#menu", label: "Menu", icon: Menu },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    setSigningOut(true);
    setTimeout(() => signOut({ callbackUrl: "/" }), 1800);
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
    {signingOut && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
        {/* Animated gradient backdrop */}
        <div className="absolute inset-0 signout-backdrop" />

        {/* Floating particles */}
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full signout-particle"
            style={{
              left: `${8 + (i * 6.5) % 84}%`,
              bottom: '-8px',
              animationDelay: `${i * 0.12}s`,
              animationDuration: `${1.4 + (i % 3) * 0.3}s`,
              background: ['#06b6d4', '#a855f7', '#FF2D78', '#eab308'][i % 4],
            }}
          />
        ))}

        {/* Center content */}
        <div className="relative flex flex-col items-center gap-5 signout-content-enter">
          {/* Pulsing rings + logo */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-[-12px] rounded-full border-2 border-[#06b6d4]/40 signout-ring-1" />
            <div className="absolute inset-[-24px] rounded-full border-2 border-[#a855f7]/30 signout-ring-2" />
            <div className="absolute inset-[-36px] rounded-full border border-[#FF2D78]/20 signout-ring-3" />

            {/* Orbiting dot */}
            <div className="absolute inset-[-24px] signout-orbit">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_10px_#06b6d4]" />
            </div>

            {/* Logo block */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#06b6d4] via-[#7b2cbf] to-[#FF2D78] flex items-center justify-center signout-logo shadow-[0_0_30px_rgba(6,182,212,0.3),0_0_60px_rgba(123,44,191,0.15)]">
              <GraduationCap className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Text */}
          <p className="text-xl font-black tracking-tight signout-text-reveal">
            <span className="bg-gradient-to-r from-[#06b6d4] via-[#a855f7] to-[#FF2D78] bg-clip-text text-transparent">
              Catch you later!
            </span>
          </p>

          {/* Bouncing dots */}
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#06b6d4] signout-dot" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-[#a855f7] signout-dot" style={{ animationDelay: '0.15s' }} />
            <div className="w-2 h-2 rounded-full bg-[#FF2D78] signout-dot" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    )}
    <NavigationProgress />
    <SWRPrefetcher />
    <div className="flex min-h-screen flex-col relative z-0">
      {/* Vibrant scattered bubbles — covers all pages automatically */}
      <VibrantBackground />
      <OnboardingModal />

      {/* ===== FIXED TOP HEADER — ALWAYS VISIBLE ===== */}
      <header className="sticky top-0 z-50 w-full flex h-16 items-center justify-between border-b-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 dark:border-[#2a2a3d] dark:bg-[#0a0e1a]/80 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#cc1a5e]">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#FF2D78]">AttendEase</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ProfileSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* ===== BODY: SIDEBAR + MAIN ===== */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={clsx(
          "hidden md:flex flex-col transition-all duration-300 ease-in-out sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto",
          "bg-gray-50/95 border-r-2 border-gray-200 dark:bg-[#070b14]/95 dark:border-[#2a2a3d] backdrop-blur-sm shrink-0 z-40",
          sidebarCollapsed ? "w-[88px]" : "w-[260px]"
        )}>
          {/* ===== TOGGLE BUTTON ===== */}
          <div className={clsx("p-3 hidden lg:flex", sidebarCollapsed ? "justify-center" : "")}>
            <button
              onClick={toggleSidebar}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                "border-2 border-[#FF2D78]/30 bg-[#FF2D78]/10 text-[#FF2D78]",
                "shadow-[0_3px_0_0_rgba(255,45,120,0.2)]",
                "hover:translate-y-[1px] hover:shadow-[0_2px_0_0_rgba(255,45,120,0.2)]",
                "transition-all duration-150"
              )}
              style={{ animation: "sidebarTogglePulse 2s ease-in-out infinite" }}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className={clsx("flex-1 px-2 space-y-1 overflow-y-auto pt-2 lg:pt-0", sidebarCollapsed ? "px-2 lg:px-3" : "px-3")}>
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
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
                  {!sidebarCollapsed && active && <ChevronRight className="w-4 h-4 ml-auto text-[#FF2D78] shrink-0" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t-2 border-gray-200 dark:border-[#2a2a3d]">
            {sidebarCollapsed ? (
              <div className="hidden lg:flex flex-col items-center gap-2">
                <Link href="/settings?edit=true" className="block hover:opacity-80 transition-opacity">
                  <UserAvatar user={user} size="sm" className="shadow-[0_2px_0_0_#cc1a5e]" />
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#06b6d4] border-2 border-[#0e7490] text-white shadow-[0_3px_0_0_#0e7490] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#0e7490] active:translate-y-[3px] active:shadow-none transition-all duration-150 cursor-pointer disabled:opacity-60"
                  title="Sign out"
                >
                  {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                </button>
              </div>
            ) : null}
            
            <div className={clsx(sidebarCollapsed ? "lg:hidden block" : "block")}>
              <Link href="/settings?edit=true" className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl hover:bg-gray-200/60 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                <UserAvatar user={user} size="md" className="shadow-[0_2px_0_0_#cc1a5e]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-text">{user.name || "Student"}</p>
                  <p className="text-xs text-text-muted truncate">{user.email}</p>
                </div>
              </Link>
              <div className="flex justify-center">
                <button
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#06b6d4] text-white border-2 border-[#0e7490] shadow-[0_3px_0_0_#0e7490] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#0e7490] active:translate-y-[3px] active:shadow-none transition-all duration-150 cursor-pointer disabled:opacity-60"
                >
                  {signingOut ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" /> : <LogOut className="w-3.5 h-3.5 shrink-0" />}
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-transparent relative">
          <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-28 lg:pb-24">
            <ReminderNotifier />
            <div key={pathname} className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-gray-200 bg-white/95 backdrop-blur-sm dark:border-[#2a2a3d] dark:bg-[#0a0e1a]/95 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-2 px-2">
          {mobileNavItems.map(item => {
            const active = pathname?.startsWith(item.href) && item.href !== "#menu";
            
            if (item.href === "#menu") {
              return (
                <button
                  key={item.href}
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition-all text-[#9ca3af] dark:text-[#6b6b80] active:scale-95 cursor-pointer"
                >
                  <item.icon className="h-5 w-5 mb-0.5" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95 cursor-pointer",
                  active ? "text-[#FF2D78]" : "text-[#9ca3af] dark:text-[#6b6b80]"
                )}
              >
                <item.icon className={clsx("h-5 w-5 mb-0.5", active ? "text-[#FF2D78]" : "")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ===== MOBILE FULLSCREEN MENU ===== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white/40 dark:bg-[#0a0e1a]/60 backdrop-blur-2xl animate-fade-in md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/30 dark:border-white/10 bg-white/30 dark:bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#cc1a5e]">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-[#FF2D78] drop-shadow-sm">Menu</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="p-2 rounded-xl border border-white/40 bg-white/50 text-[#1a1a2e] shadow-sm active:translate-y-[2px] dark:border-white/10 dark:bg-black/30 dark:text-white backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6 bg-transparent">
             <div>
               <h3 className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3 px-1 drop-shadow-sm">Navigation</h3>
               <div className="grid grid-cols-2 gap-3">
                 {navItems.map(item => {
                   return (
                     <Link 
                       key={item.href} 
                       href={item.href} 
                       onClick={() => setMobileMenuOpen(false)}
                       className="relative overflow-hidden flex flex-col items-center gap-2 p-3 rounded-2xl border border-white/40 dark:border-white/10 transition-all duration-150 active:translate-y-[2px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl group"
                     >
                        <div className={clsx("absolute inset-0 opacity-70 dark:opacity-50 bg-gradient-to-br", item.gradient)} />
                        
                        <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-1 bg-white/20 dark:bg-black/20 border border-white/40 dark:border-white/20 shadow-inner group-active:scale-95 transition-transform">
                          <item.icon className="w-5 h-5 text-white drop-shadow-sm" />
                        </div>
                        <span className="relative z-10 text-xs font-bold text-center text-white drop-shadow-md">
                          {item.label}
                        </span>
                     </Link>
                   );
                 })}
               </div>
             </div>

             <div className="border-t border-white/30 dark:border-white/10 pt-6">
                <Link 
                  href="/settings?edit=true" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl"
                >
                  <div className="absolute inset-0 bg-white/40 dark:bg-black/40" />
                  <UserAvatar user={user} size="lg" className="relative z-10 shadow-[0_2px_0_0_#cc1a5e]" />
                  <div className="relative z-10 flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-[#1a1a2e] dark:text-white truncate drop-shadow-sm">{user?.name || "Student"}</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate drop-shadow-sm">{user?.email}</p>
                  </div>
                  <ChevronRight className="relative z-10 w-5 h-5 text-gray-700 dark:text-gray-300" />
                </Link>
             </div>

             <button
               onClick={handleLogout}
               disabled={signingOut}
               className="relative overflow-hidden w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl active:translate-y-[2px] disabled:opacity-60 transition-all duration-150 cursor-pointer"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/70 to-blue-500/70 dark:from-cyan-500/50 dark:to-blue-500/50" />
               <div className="relative z-10 flex items-center gap-2 text-white font-black drop-shadow-md">
                 {signingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                 {signingOut ? "Signing out..." : "Sign Out"}
               </div>
             </button>
          </div>
        </div>
      )}
      
      <ScheduleChatbot />
    </div>
    </ProfileProvider>
  );
}
