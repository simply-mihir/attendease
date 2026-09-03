"use client";
import { useState, useCallback, useEffect } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate, invalidatePrefix } from "@/hooks/useSWRFetch";
import {
  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,
  Timer, TrendingUp, BookOpen, ArrowRight, Sparkles, Zap, Ban, Target, ChevronDown, Camera, Download, ChevronRight, ArrowDown, GraduationCap, Minus, TrendingDown
, BarChart3 , Settings } from "lucide-react";
import clsx from "clsx";
import { GoalSetupPopup } from "@/components/GoalSetupPopup";
import { subjectHref } from "@/lib/subject-slug";
import { ScheduleCard } from "@/components/MemoizedScheduleCard";
import { MarkingProgressBar } from "@/components/MarkingProgressBar";
import { ParticleBurst } from "@/components/ParticleBurst";
import { StreakFlame } from "@/components/StreakFlame";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { StreakBadges } from "@/components/StreakBadges";
import { PageTransition } from "@/components/PageTransition";
import { DashboardQuickMark } from "./DashboardQuickMark";
import { StaggerGrid } from "@/components/StaggerGrid";
import { getClassesForDay } from "@/lib/schedule-utils";
const SUBJECT_COLORS = [
  { bg: "#FF2D78", shadow: "#cc1a5e", label: "Hot Pink" },
  { bg: "#4361ee", shadow: "#3451cc", label: "Royal Blue" },
  { bg: "#06d6a0", shadow: "#05a87e", label: "Teal" },
  { bg: "#ff6b35", shadow: "#cc5529", label: "Orange" },
  { bg: "#9b5de5", shadow: "#7c4ab8", label: "Purple" },
  { bg: "#4cc9f0", shadow: "#3aa3c4", label: "Cyan" },
  { bg: "#f15bb5", shadow: "#c14890", label: "Magenta" },
  { bg: "#FFD166", shadow: "#ccaa52", label: "Gold" },
  { bg: "#ef476f", shadow: "#c43559", label: "Coral" },
  { bg: "#2ec4b6", shadow: "#249e92", label: "Mint" },
];

interface TodayClass {
  scheduleId: string; subjectId: string; subjectName: string; colorHex: string;
  startTime: string; endTime: string; room: string | null; currentPct: number;
  minPct: number; statusColor: string; streakCount: number;
  attendanceMarked: boolean; attendanceStatus: string | null;
}

interface SubjectSummary {
  id: string; name: string; code: string | null; colorHex: string;
  currentPercentage: number; statusColor: string; statusLabel: string;
  canSkipCount: number; mustAttendCount: number; streakCount: number;
  totalClasses: number; totalCancelled: number; minAttendancePct: number;
}

interface DashboardData {
  stats: {
    overallAttendance: number; totalSubjects: number; dangerCount: number;
  };
  subjects: SubjectSummary[];
  dangerSubjects: SubjectSummary[];
  todaySchedule: any[];
  isCurrentSemester?: boolean;
  semesterName?: string | null;
  userName?: string;
  // Fallbacks for older data structure compatibility (optional)
  overallPct?: number; safeSubjects?: number; warningSubjects?: number; currentStreak?: number; longestStreak?: number; subjectsSummary?: SubjectSummary[]; totalSubjects?: number;
  activeSemester?: {
    id: string; name: string; startDate: string; endDate: string; isCurrent: boolean;
    holidays: { id: string; name: string; date: string }[];
    examPeriods: { id: string; name: string; startDate: string; endDate: string }[];
  } | null;
  orphanCount?: number;
}

interface GoalPlanData {
  goalPct: number;
  goalType: string;
  goalSetupComplete: boolean;
  goalEnabled: boolean;
  todaysPlan: {
    subjectName: string; colorHex: string; startTime: string; endTime: string;
    room: string | null; currentPct: number; priority: "mandatory" | "recommended" | "optional";
    canSkipForGoal: number; scheduleId: string; subjectId: string;
  }[];
  summary: { mustAttend: number; canSkip: number; total: number };
}

export function DashboardView({ semesterId }: { semesterId?: string }) {
  const qs = semesterId ? `?semesterId=${semesterId}` : "";
  const { data: dashboard, isLoading: dashLoading } = useSWRFetch<DashboardData>(`/dashboard${qs}`);
  const { data: goalPlan, isLoading: goalLoading } = useSWRFetch<GoalPlanData>("/analytics/goal-plan");

  const [goalExpanded, setGoalExpanded] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingStatus, setMarkingStatus] = useState<{ active: boolean; status: "PRESENT" | "ABSENT" | null }>({ active: false, status: null });
  const [particleBurst, setParticleBurst] = useState<{ trigger: boolean; x: number; y: number; type: "present" | "absent" }>({ trigger: false, x: 0, y: 0, type: "present" });

  const [showImportSubjects, setShowImportSubjects] = useState(false);
  const [importableSubjects, setImportableSubjects] = useState<{ orphans: any[]; fromOtherSemesters: any[] } | null>(null);
  const [loadingImportable, setLoadingImportable] = useState(false);
  const [selectedImports, setSelectedImports] = useState<Map<string, "move" | "copy">>(new Map());
  const [importing, setImporting] = useState(false);

  // Fetch overrides for today
  const currentDate = new Date();
  const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString();
  const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59).toISOString();
  const { data: overData } = useSWRFetch<{ overrides: any[] }>(`/schedule-override?startDate=${startOfDay}&endDate=${endOfDay}`);

  useEffect(() => {
    const handler = () => {
      invalidatePrefix("/schedule-override");
      invalidatePrefix("/dashboard");
    };
    window.addEventListener("scheduleOverrideChanged", handler);
    return () => window.removeEventListener("scheduleOverrideChanged", handler);
  }, []);

  const loading = dashLoading || goalLoading;

  const quickMark = useCallback(async (subjectId: string, scheduleId: string, status: string, weight?: number, isExtra?: boolean) => {
    setMarkingId(`${subjectId}-${status}`);
    
    if (status === "present" || status === "absent") {
      setMarkingStatus({ active: true, status: status === "present" ? "PRESENT" : "ABSENT" });
      
      const btn = document.querySelector(`[data-schedule="${scheduleId}"]`);
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setParticleBurst({
          trigger: true,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          type: status === "present" ? "present" : "absent",
        });
        setTimeout(() => setParticleBurst(p => ({ ...p, trigger: false })), 100);
      }
    }

    try {
      // Use local date (not UTC) to avoid timezone mismatch after midnight
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({ 
          subjectId, 
          scheduleId: isExtra ? undefined : scheduleId, 
          date: localDate, 
          status, 
          source: isExtra ? "extra_class" : "quick_widget",
          weight: weight || 1
        }),
      });
      await invalidate(`/dashboard${qs}`);
      await invalidate("/analytics/goal-plan");
    } catch (err) { console.error(err); }
    finally { 
      setMarkingId(null); 
      setTimeout(() => setMarkingStatus({ active: false, status: null }), 1200);
    }
  }, [qs]);

  // Import Modal logic
  const activeSemId = dashboard?.activeSemester?.id || semesterId;
  
  useEffect(() => {
    if (!showImportSubjects || !activeSemId) return;
    setLoadingImportable(true);
    apiFetch(`/semesters/${activeSemId}/import`)
      .then((data: any) => {
        setImportableSubjects(data);
        setSelectedImports(new Map());
      })
      .catch(console.error)
      .finally(() => setLoadingImportable(false));
  }, [showImportSubjects, activeSemId]);

  function toggleImportSelection(subjectId: string, isOrphan: boolean) {
    setSelectedImports(prev => {
      const next = new Map(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.set(subjectId, isOrphan ? "move" : "copy");
      return next;
    });
  }

  function switchImportMode(subjectId: string) {
    setSelectedImports(prev => {
      const next = new Map(prev);
      const current = next.get(subjectId);
      if (current) next.set(subjectId, current === "move" ? "copy" : "move");
      return next;
    });
  }

  async function handleImport() {
    if (selectedImports.size === 0 || importing || !activeSemId) return;
    setImporting(true);
    try {
      const subjects = Array.from(selectedImports.entries()).map(([id, mode]) => ({ id, mode }));
      await apiFetch(`/semesters/${activeSemId}/import`, {
        method: "POST",
        body: JSON.stringify({ subjects }),
      });
      await invalidate(`/dashboard${qs}`);
      setShowImportSubjects(false);
      setSelectedImports(new Map());
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setImporting(false);
    }
  }

  // Normalize data depending on backend response (supporting both new combined and legacy shapes)
  const isCurrent = dashboard?.isCurrentSemester ?? true;
  const overallPct = dashboard?.stats?.overallAttendance ?? dashboard?.overallPct ?? 0;
  const currentStreak = dashboard?.currentStreak ?? 0; // Or calculate if missing from new API
  const longestStreak = dashboard?.longestStreak ?? 0;
  const totalSubjects = dashboard?.stats?.totalSubjects ?? dashboard?.totalSubjects ?? 0;
  const dangerCount = dashboard?.stats?.dangerCount ?? dashboard?.dangerSubjects?.length ?? 0;
  const dangerSubjectsList = dashboard?.dangerSubjects || (dashboard?.subjectsSummary?.filter((s) => s.statusColor === "red")) || [];
  const subjectsList = dashboard?.subjects || dashboard?.subjectsSummary || [];
  const todayClasses = dashboard?.todaySchedule || [];

  const d = new Date();
  const today = {
    dayName: d.toLocaleDateString("en-IN", { weekday: "long" }),
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  };

  const { data: session } = useSession();
  const displayName = dashboard?.userName || session?.user?.name || "Student";

  // Check semester status
  const activeSemester = dashboard?.activeSemester;
  const todayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const semesterEnded = activeSemester && new Date(activeSemester.endDate) < todayStart;
  const todayHoliday = activeSemester?.holidays?.find(h => {
    const hDate = new Date(h.date);
    return hDate.getFullYear() === todayStart.getFullYear() && hDate.getMonth() === todayStart.getMonth() && hDate.getDate() === todayStart.getDate();
  });
  const currentExam = activeSemester?.examPeriods?.find(ep => {
    return todayStart >= new Date(ep.startDate) && todayStart <= new Date(ep.endDate);
  });

  // Show full loading animation until real data arrives — never render 0% defaults
  if (!dashboard) {
    return <FuturisticLoader title="Loading Dashboard..." Icon={BarChart3} variant="full" />;
  }

  return (
    <PageTransition direction="up" staggerChildren={false} className="space-y-6">
      {goalPlan && !goalPlan.goalSetupComplete && (
        <GoalSetupPopup onHide={() => invalidate("/analytics/goal-plan")} />
      )}
      <MarkingProgressBar isActive={markingStatus.active} status={markingStatus.status} />
      <ParticleBurst trigger={particleBurst.trigger} x={particleBurst.x} y={particleBurst.y} type={particleBurst.type} />
      {/* Greeting */}
      <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <h1 className="greeting-animated text-3xl font-extrabold text-[#1a1a2e] dark:text-white">
          Hello {displayName}
        </h1>
        <p className="mt-1 text-sm font-semibold text-[#4a4a5a] dark:text-[#6b6b80]">
          {dashboard?.semesterName 
            ? `Your attendance report for ${dashboard.semesterName} is ready. Let's make every class count!` 
            : "Here is your attendance overview. Let's make every class count!"} 
          <span className="mx-2 opacity-50">·</span>
          {today?.date}
        </p>
      </div>

      {/* Semester Banner */}
      <div className="relative mb-6 flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl p-5 overflow-hidden gap-4 transition-all duration-150 bg-lime-500/[0.06] border-2 border-lime-500/40 shadow-[0_6px_0_0_#84cc16] dark:bg-lime-500/[0.08] dark:border-lime-500/40 dark:shadow-[0_6px_0_0_#65a30d]" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500/15 dark:bg-lime-500/20 text-lime-500 border border-lime-500/30 shadow-sm backdrop-blur-md">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-[#1a1a2e] dark:text-white text-lg">{dashboard?.semesterName || "All Semesters"}</h2>
            <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#6b6b80]">{today?.dayName}, {today?.date}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0">
          <Link href="/settings/semesters" className="btn-3d-secondary flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-bold">
            <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Manage Semesters</span><span className="sm:hidden">Manage</span>
          </Link>
          {isCurrent && activeSemId && (
            <button
              onClick={() => setShowImportSubjects(true)}
              className="btn-3d-gray flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-bold cursor-pointer"
            >
              <ArrowDown className="h-4 w-4 shrink-0" /> Import
            </button>
          )}
          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="btn-3d-primary flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-bold">
            <Plus className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">New Subject</span><span className="sm:hidden">Subject</span>
          </Link>
        </div>
      </div>

      {todayHoliday && (
        <div className="rounded-2xl border-2 border-[#06d6a0]/30 bg-[#06d6a0]/10 dark:border-[#06d6a0]/20 dark:bg-[#06d6a0]/5 p-5 mb-6 shadow-[0_4px_0_0_#06d6a0/20]" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 50ms forwards" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06d6a0]/20 text-[#06d6a0] border border-[#06d6a0]/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#06d6a0] dark:text-[#06d6a0]">{todayHoliday.name}</h3>
              <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#c4c4d4]">Holiday today — no classes scheduled. Enjoy!</p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Alert */}
      {isCurrent && dangerSubjectsList.length > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3 bg-[#ef476f]/10 border-2 border-[#ef476f]/30 shadow-[0_4px_0_0_#ef476f/20] mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 50ms forwards" }}>
          <div className="w-10 h-10 rounded-xl bg-[#ef476f] border border-[#c43559] flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#c43559]">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-[#ef476f] text-sm">Attendance Danger Zone</p>
            <p className="text-sm font-medium text-[#ef476f]/90 dark:text-rose-300 mt-1">
              {dangerSubjectsList.map((s) => s.name).join(", ")} — below minimum threshold. Attend classes immediately!
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={100} staggerDelay={80} animation="fadeSlideUp">
        {/* Overall (Teal) */}
        <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
          bg-[#06d6a0]/[0.06] border-2 border-[#06d6a0]/40 shadow-[0_6px_0_0_#06d6a0] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#06d6a0]
          dark:bg-[#06d6a0]/[0.08] dark:border-[#06d6a0]/40 dark:shadow-[0_6px_0_0_#049e77] dark:hover:shadow-[0_4px_0_0_#049e77]">
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#06d6a0] uppercase tracking-wider">Overall</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06d6a0]/20 text-[#06d6a0] border border-[#06d6a0]/30 shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center h-9 mt-1"><FieldLoader size="lg" /></div>
            ) : (
              <p className="text-3xl font-black text-[#1a1a2e] dark:text-white tracking-tight mt-1"><AnimatedCounter value={overallPct} suffix="%" /></p>
            )}
          </div>
        </div>

          {/* Subjects (Royal Blue) */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
            bg-[#4361ee]/[0.06] border-2 border-[#4361ee]/40 shadow-[0_6px_0_0_#4361ee] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#4361ee]
            dark:bg-[#4361ee]/[0.08] dark:border-[#4361ee]/40 dark:shadow-[0_6px_0_0_#3451cc] dark:hover:shadow-[0_4px_0_0_#3451cc]">
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#4361ee] uppercase tracking-wider">Subjects</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4361ee]/20 text-[#4361ee] border border-[#4361ee]/30 shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              {loading ? (
                <div className="flex items-center h-9 mt-1"><FieldLoader size="lg" /></div>
              ) : (
                <p className="text-3xl font-black text-[#1a1a2e] dark:text-white tracking-tight mt-1"><AnimatedCounter value={totalSubjects} /></p>
              )}
            </div>
          </div>

          {/* Streak (Orange) */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
            bg-[#ff6b35]/[0.06] border-2 border-[#ff6b35]/40 shadow-[0_6px_0_0_#ff6b35] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#ff6b35]
            dark:bg-[#ff6b35]/[0.08] dark:border-[#ff6b35]/40 dark:shadow-[0_6px_0_0_#cc5529] dark:hover:shadow-[0_4px_0_0_#cc5529]">

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#ff6b35] uppercase tracking-wider">Streak</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35] group-hover:scale-110 transition-transform">
                  <Flame 
                    className="h-5 w-5 drop-shadow-[0_0_6px_rgba(255,107,53,0.5)]" 
                    fill={currentStreak > 0 ? "#ff6b35" : "none"}
                    style={currentStreak > 0 ? { animation: "streakFlicker 1.5s ease-in-out infinite" } : undefined} 
                  />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1 h-9">
                {loading ? (
                  <FieldLoader size="lg" />
                ) : (
                  <>
                    <p className="text-3xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight"><AnimatedCounter value={currentStreak} /></p>
                    {currentStreak > 0 && (
                      <div className="flex items-end -mb-0.5">
                        <Flame className="h-7 w-7 text-[#ff6b35] drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]" fill="#ff6b35" style={{ animation: "streakFlicker 1.5s ease-in-out infinite" }} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* In Danger (Coral) */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
            bg-[#ef476f]/[0.06] border-2 border-[#ef476f]/40 shadow-[0_6px_0_0_#ef476f] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#ef476f]
            dark:bg-[#ef476f]/[0.08] dark:border-[#ef476f]/40 dark:shadow-[0_6px_0_0_#c43559] dark:hover:shadow-[0_4px_0_0_#c43559]">
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#ef476f] uppercase tracking-wider">{isCurrent ? "In Danger" : "Failed"}</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-[#ef476f]/20 text-[#ef476f] border-[#ef476f]/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              {loading ? (
                <div className="flex items-center h-9 mt-1"><FieldLoader size="lg" /></div>
              ) : (
                <p className="text-3xl font-black tracking-tight mt-1 text-[#ef476f]"><AnimatedCounter value={dangerCount} /></p>
              )}
            </div>
          </div>
        </StaggerGrid>

      {/* Streak Badges */}
      {isCurrent && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 100ms forwards" }}>
          <StreakBadges streak={currentStreak} longestStreak={longestStreak} />
        </div>
      )}

      {/* Goal Mode Card */}
      {isCurrent && goalPlan && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 120ms forwards" }}>
          {goalPlan.goalEnabled && goalPlan.todaysPlan.length > 0 ? (
            <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] overflow-hidden transition-all">
              <button
                onClick={() => setGoalExpanded(!goalExpanded)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#9b5de5]/20 text-[#9b5de5] border border-[#9b5de5]/30 flex items-center justify-center font-bold shadow-sm">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-[#1a1a2e] dark:text-white">Today&apos;s Goal Plan</h3>
                    <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#6b6b80]">
                      Attend {goalPlan.summary.mustAttend} of {goalPlan.summary.total} to stay on track
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#9b5de5]/20 text-[#9b5de5] border border-[#9b5de5]/30">
                    {goalPlan.goalPct}% goal
                  </span>
                  <ChevronDown className={clsx("w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform", goalExpanded && "rotate-180")} />
                </div>
              </button>
              {goalExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {goalPlan.todaysPlan.map((cls) => (
                    <div
                      key={cls.scheduleId}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                        cls.priority === "mandatory" ? "border-[#ef476f]/60 bg-[#ef476f]/[0.15]" :
                        cls.priority === "recommended" ? "border-[#ff6b35]/60 bg-[#ff6b35]/[0.15]" :
                        "border-[#06d6a0]/60 bg-[#06d6a0]/[0.15]"
                      )}
                    >
                      <div className="w-2 h-10 rounded-full shadow-sm" style={{ backgroundColor: cls.colorHex }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1a1a2e] dark:text-white break-words">{cls.subjectName}</p>
                        <p className="text-xs text-[#4a4a5a] dark:text-[#6b6b80] flex items-center gap-2 mt-0.5 font-medium">
                          <Clock className="w-3 h-3" /> {cls.startTime} - {cls.endTime}
                          {cls.room && <><MapPin className="w-3 h-3 ml-1" /> {cls.room}</>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={clsx(
                          "text-xs font-bold px-2.5 py-1 rounded-lg border",
                          cls.priority === "mandatory" ? "bg-[#ef476f]/30 text-[#ef476f] border-[#ef476f]/50" :
                          cls.priority === "recommended" ? "bg-[#ff6b35]/30 text-[#ff6b35] border-[#ff6b35]/50" :
                          "bg-[#06d6a0]/30 text-[#06d6a0] border-[#06d6a0]/50"
                        )}>
                          {cls.priority === "mandatory" ? "🔴 Must attend" :
                           cls.priority === "recommended" ? "🟡 Should attend" :
                           "🟢 Safe to skip"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !goalPlan.goalEnabled ? (
            <Link href="/settings/goal" className="group relative flex items-center justify-between rounded-2xl overflow-hidden p-5 transition-all duration-150 hover:translate-y-[2px] cursor-pointer
              bg-white border-2 border-gray-200 shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9b5de5]/20 text-[#9b5de5] border border-[#9b5de5]/30 shadow-sm">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1a1a2e] dark:text-white">Set Your Attendance Goal</h3>
                  <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#6b6b80]">Get a daily action plan showing which classes to attend</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#FF2D78] group-hover:translate-x-1 transition-all" />
            </Link>
          ) : null}
        </div>
      )}

      {/* Today's Classes */}
      {isCurrent && (
        (() => {
          if (currentExam) {
            const examName = currentExam.name.toLowerCase().includes('exam') ? currentExam.name : `${currentExam.name} Exams`;
            const userName = session?.user?.name?.split(' ')[0] || "Student";
            
            return (
              <div className="space-y-4 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-[#1a1a2e] dark:text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-[#4361ee]" />
                    Today's Classes
                  </h2>
                </div>
                <div className="rounded-2xl p-8 bg-gradient-to-br from-[#4361ee]/10 to-[#9b5de5]/10 dark:from-[#4361ee]/15 dark:to-[#9b5de5]/15 border-2 border-[#4361ee]/20 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 opacity-10">
                    <GraduationCap className="w-40 h-40" />
                  </div>
                  <div className="flex justify-center mb-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1a1a2e] border-2 border-[#4361ee]/30 flex items-center justify-center text-[#4361ee] shadow-sm">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#1a1a2e] dark:text-white mb-2 relative z-10">
                    No classes. {examName} are going on.
                  </h3>
                  <p className="text-[#4a4a5a] dark:text-[#6b6b80] font-bold relative z-10 text-base">
                    Best wishes {userName} for your {examName}!
                  </p>
                </div>
              </div>
            );
          }

          const todayClasses = getClassesForDay(new Date(), dashboard?.todaySchedule || [], overData?.overrides || []);
          return todayClasses.length > 0 ? (
            <div className="space-y-4 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-[#1a1a2e] dark:text-white flex items-center gap-2">
                  <Clock className="w-6 h-6 text-[#4361ee]" />
                  Today's Classes
                </h2>
                <Link href="/calendar" className="text-sm font-bold text-[#FF2D78] hover:text-[#cc1a5e] flex items-center gap-1 transition-colors">
                  View Calendar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" delay={200} staggerDelay={80} animation="scaleIn">
                {todayClasses.map((schedule: any) => (
                  <ScheduleCard 
                    key={schedule.id || schedule.subjectId + schedule.startTime} 
                    cls={schedule} 
                    marking={markingId}
                    onMark={quickMark} 
                  />
                ))}
              </StaggerGrid>
            </div>
          ) : null;
        })()
      )}

      {/* Subject Cards */}
      {isCurrent && dashboard?.subjects && dashboard.subjects.length > 0 && (
        <DashboardQuickMark subjects={dashboard.subjects} />
      )}

      {/* Subject Cards */}
      {(loading || (dashboard && subjectsList.length > 0)) && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 200ms forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-[#1a1a2e] dark:text-white">All Subjects</h2>
            <span className="text-sm font-bold text-[#4a4a5a] dark:text-[#6b6b80]">
              {loading ? <div className="flex items-center gap-1 opacity-60"><FieldLoader size="sm" /></div> : `${subjectsList.length} courses`}
            </span>
          </div>
          <StaggerGrid className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" delay={250} staggerDelay={80} animation="fadeSlideUp">
            {(loading ? Array.from({ length: 4 }).map((_, i) => ({ id: `dummy-${i}`, dummy: true })) : subjectsList).map((s: any, index: number) => {
              const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
              const percentage = s.dummy ? 0 : (s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100));
              const min = s.dummy ? 75 : (s.minAttendancePct ?? 75);
              const attended = s.dummy ? 0 : (s.totalPresent ?? 0);
              const total = s.dummy ? 0 : (s.totalClassesHeld ?? 0);
              const StatusIcon = percentage >= min ? TrendingUp : percentage >= min - 15 ? AlertTriangle : TrendingDown;
              
              return (
                <Link
                  key={s.id}
                  href={s.dummy ? "#" : subjectHref(s.slug || s.id)}
                  className="group relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-150 block
                    hover:translate-y-[2px] overflow-hidden"
                  style={{
                    borderColor: `${color.bg}40`,
                    backgroundColor: `${color.bg}0D`,
                    boxShadow: `0 6px 0 0 ${color.bg}30`,
                  }}
                  onClick={(e) => s.dummy && e.preventDefault()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 4px 0 0 ${color.bg}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 6px 0 0 ${color.bg}30`;
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {/* Animated gradient shimmer on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${color.bg}08 0%, ${color.bg}15 50%, ${color.bg}08 100%)`,
                      backgroundSize: "200% 200%",
                      animation: "subjectCardShimmer 3s ease-in-out infinite",
                    }} />

                  {/* Top accent line */}
                  <div className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: `linear-gradient(to right, transparent, ${color.bg}60, transparent)` }} />

                  <div className="relative flex flex-col h-full">
                    {/* Row 1: Label + Icon */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider break-words flex-1"
                        style={{ color: color.bg }}>
                        {loading ? <FieldLoader size="sm" /> : s.name}
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg group-hover:scale-110 transition-all duration-300 mt-[-2px]"
                        style={{ backgroundColor: `${color.bg}1A`, color: color.bg }}>
                        <BookOpen className="h-4 w-4 block group-hover:hidden" />
                        <ChevronRight className="h-4 w-4 hidden group-hover:block" />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {/* Row 2: Big percentage number */}
                    <div className="text-3xl font-extrabold text-[#1a1a2e] dark:text-white mb-1 h-9 flex items-center">
                      {loading ? <FieldLoader size="lg" /> : `${percentage}%`}
                    </div>

                    {/* Row 3: Status + class count */}
                    <div className="flex items-center justify-between h-4">
                      {loading ? (
                        <div className="opacity-60"><FieldLoader size="sm" /></div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="h-3.5 w-3.5" style={{ color: color.bg }} />
                            <span className="text-xs font-semibold"
                              style={{ color: percentage >= min ? "#06d6a0" : percentage >= min - 15 ? "#ff6b35" : "#ef476f" }}>
                              {percentage >= min ? "On track" : percentage >= min - 15 ? "At risk" : "Danger"}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#9ca3af] dark:text-[#6b6b80]">
                            {attended}/{total}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Row 4: Mini progress bar */}
                    <div className="mt-3">
                      <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, percentage)}%`,
                            backgroundColor: color.bg,
                            boxShadow: `0 0 8px ${color.bg}40`,
                          }} />
                      </div>
                    </div>

                    {/* Subject code — small */}
                    <p className="text-[10px] text-[#9ca3af] dark:text-[#6b6b80] mt-2 font-semibold">
                      {s.code || "No code"}
                    </p>
                    </div>
                  </div>

                </Link>
              );
            })}
          </StaggerGrid>
        </div>
      )}

      {/* Empty state */}
      {dashboard && totalSubjects === 0 && (
        <div className="text-center py-16 rounded-2xl bg-white border-2 border-gray-200 shadow-[0_6px_0_0_#d1d5db] dark:bg-[#141425] dark:border-[#2a2a3d] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 100ms forwards" }}>
          <div className="w-20 h-20 rounded-2xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_0_#cc1a5e]">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-black mb-2 text-[#1a1a2e] dark:text-white">No subjects yet</h2>
          <p className="text-[#4a4a5a] dark:text-[#6b6b80] mb-6 font-medium">Add your first subject to start tracking attendance</p>

          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="btn-3d-primary px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold">
            <Plus className="w-5 h-5" /> Add Your First Subject
          </Link>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-3 font-semibold">or</p>
          <div className="flex flex-col gap-2 mt-2 items-center">
            {isCurrent && activeSemId && (
              <button onClick={() => setShowImportSubjects(true)} className="btn-3d-cyan px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full max-w-xs font-bold cursor-pointer">
                <Download className="w-5 h-5" /> Import Existing Subjects
              </button>
            )}
            <Link href="/import" className="btn-3d-secondary px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full max-w-xs font-bold">
              <Camera className="w-5 h-5" /> Import from Timetable Photo
            </Link>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportSubjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImportSubjects(false)}>
          <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border-2 border-gray-200 bg-white shadow-[0_12px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a]" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 border-b-2 border-gray-200 dark:border-[#2a2a3d]">
              <h3 className="text-lg font-black text-[#1a1a2e] dark:text-white">Import Subjects</h3>
              <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#6b6b80] mt-1">
                Add existing subjects to this semester
              </p>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingImportable ? (
                <FuturisticLoader variant="inline" title="Loading subjects" Icon={BookOpen} />
              ) : (
                <>
                  {/* Orphan subjects */}
                  {importableSubjects?.orphans && importableSubjects.orphans.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#1a1a2e] dark:text-white mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#ff6b35]" />
                        Unassigned Subjects
                      </h4>
                      <div className="space-y-2">
                        {importableSubjects.orphans.map(subject => (
                          <ImportSubjectCard
                            key={subject.id} subject={subject} semesterName={null}
                            isSelected={selectedImports.has(subject.id)}
                            mode={selectedImports.get(subject.id) || "move"}
                            onToggle={() => toggleImportSelection(subject.id, true)}
                            onSwitchMode={() => switchImportMode(subject.id)} isOrphan={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subjects from other semesters */}
                  {importableSubjects?.fromOtherSemesters && importableSubjects.fromOtherSemesters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#1a1a2e] dark:text-white mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#4361ee]" />
                        From Other Semesters
                      </h4>
                      <div className="space-y-2">
                        {importableSubjects.fromOtherSemesters.map(subject => (
                          <ImportSubjectCard
                            key={subject.id} subject={subject} semesterName={subject.semester?.name}
                            isSelected={selectedImports.has(subject.id)}
                            mode={selectedImports.get(subject.id) || "copy"}
                            onToggle={() => toggleImportSelection(subject.id, false)}
                            onSwitchMode={() => switchImportMode(subject.id)} isOrphan={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {(!importableSubjects?.orphans?.length && !importableSubjects?.fromOtherSemesters?.length) && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-[#4a4a5a] dark:text-[#c4c4d4] text-sm font-semibold">No subjects available to import</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">All subjects are already in this semester</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t-2 border-gray-200 dark:border-[#2a2a3d] flex items-center justify-between">
              <p className="text-sm font-bold text-[#4a4a5a] dark:text-[#6b6b80]">
                {selectedImports.size > 0 ? `${selectedImports.size} subject${selectedImports.size > 1 ? "s" : ""} selected` : "Select subjects to import"}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowImportSubjects(false)} className="btn-3d-ghost px-4 py-2 text-sm font-bold cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleImport} disabled={selectedImports.size === 0 || importing}
                  className="btn-3d-primary px-5 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {importing ? "Importing..." : `Import ${selectedImports.size > 0 ? selectedImports.size : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function ImportSubjectCard({
  subject, semesterName, isSelected, mode, onToggle, onSwitchMode, isOrphan
}: {
  subject: any; semesterName: string | null; isSelected: boolean; mode: "move" | "copy";
  onToggle: () => void; onSwitchMode: () => void; isOrphan: boolean;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-violet-500/50 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10"
          : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 hover:border-gray-300 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] dark:hover:border-white/10"
      }`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
        isSelected ? "border-violet-600 bg-violet-600" : "border-gray-300 bg-white dark:border-white/20 dark:bg-white/5"
      }`}>
        {isSelected && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-words">{subject.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {semesterName ? `From ${semesterName}` : "Not assigned to any semester"}
          {subject._count?.attendanceRecords > 0 && ` · ${subject._count.attendanceRecords} records`}
        </p>
      </div>

      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onSwitchMode(); }}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
            mode === "move"
              ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
              : "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
          }`}
        >
          {mode === "move" ? "Move" : "Copy"}
        </button>
      )}
    </div>
  );
}

