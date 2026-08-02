"use client";
import { useState, useCallback, useEffect } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import {
  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,
  Timer, TrendingUp, BookOpen, ArrowRight, Sparkles, Zap, Ban, Target, ChevronDown, Camera, Download, ChevronRight, ArrowDown, GraduationCap
, BarChart3 } from "lucide-react";
import clsx from "clsx";
import { ScheduleCard } from "@/components/MemoizedScheduleCard";
import { MarkingProgressBar } from "@/components/MarkingProgressBar";
import { ParticleBurst } from "@/components/ParticleBurst";
import { StreakFlame } from "@/components/StreakFlame";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";
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

  const loading = dashLoading || goalLoading;

  const quickMark = useCallback(async (subjectId: string, scheduleId: string, status: string) => {
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
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({ subjectId, scheduleId, date: new Date().toISOString().slice(0, 10), status, source: "quick_widget" }),
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

  if (loading) {
    return <FuturisticLoader variant="section" title="Loading your dashboard" Icon={BarChart3} />;
  }

  return (
    <PageTransition direction="up" staggerChildren={false} className="space-y-6">
      <MarkingProgressBar isActive={markingStatus.active} status={markingStatus.status} />
      <ParticleBurst trigger={particleBurst.trigger} x={particleBurst.x} y={particleBurst.y} type={particleBurst.type} />
                  {/* Greeting */}
      <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Hello, <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 dark:from-violet-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          {dashboard?.semesterName 
            ? `Your attendance report for ${dashboard.semesterName} is ready. Let's make every class count!` 
            : "Here is your attendance overview. Let's make every class count!"} 
          <span className="mx-2 opacity-50">·</span>
          {today?.date}
        </p>
      </div>

      {/* Semester Banner */}
      <div className="relative mb-6 flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:shadow-none p-5 overflow-hidden gap-4" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{dashboard?.semesterName || "All Semesters"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{today?.dayName}, {today?.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCurrent && activeSemId && (
            <button
              onClick={() => setShowImportSubjects(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <ArrowDown className="h-4 w-4" /> Import
            </button>
          )}
          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Add Subject
          </Link>
        </div>
      </div>

      {todayHoliday && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/5 dark:backdrop-blur-xl p-5 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 50ms forwards" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-teal-800 dark:text-teal-300">{todayHoliday.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Holiday today — no classes scheduled. Enjoy!</p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Alert */}
      {isCurrent && dangerSubjectsList.length > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3 bg-rose-50 border border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/20 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 50ms forwards" }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Attendance Danger Zone</p>
            <p className="text-sm text-rose-600/90 dark:text-gray-300 mt-1">
              {dangerSubjectsList.map((s) => s.name).join(", ")} — below minimum threshold. Attend classes immediately!
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {dashboard && (
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={100} staggerDelay={80} animation="fadeSlideUp">
          {/* Overall (Teal) */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200/60 shadow-sm hover:shadow-md hover:shadow-teal-500/15 hover:border-teal-300
            dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.07] dark:hover:border-teal-500/30 dark:hover:shadow-lg dark:hover:shadow-teal-500/15">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Overall</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 group-hover:scale-110 group-hover:bg-teal-200 dark:group-hover:bg-teal-500/20 transition-all">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight"><AnimatedCounter value={overallPct} suffix="%" /></p>
            </div>
          </div>

          {/* Subjects (Blue) */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200/60 shadow-sm hover:shadow-md hover:shadow-blue-500/15 hover:border-blue-300
            dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.07] dark:hover:border-blue-500/30 dark:hover:shadow-lg dark:hover:shadow-blue-500/15">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Subjects</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-all">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight"><AnimatedCounter value={totalSubjects} /></p>
            </div>
          </div>

          {/* Streak (Orange) */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200/60 shadow-sm hover:shadow-md hover:shadow-orange-500/15 hover:border-orange-300
            dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.07] dark:hover:border-orange-500/30 dark:hover:shadow-lg dark:hover:shadow-orange-500/15">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {currentStreak > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-orange-500/15 blur-2xl" style={{ animation: "streakGlow 2s ease-in-out infinite" }} />
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Streak</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 group-hover:scale-110 group-hover:bg-orange-200 dark:group-hover:bg-orange-500/20 transition-all">
                  <Flame className="h-5 w-5" style={currentStreak > 0 ? { animation: "streakFlicker 1.5s ease-in-out infinite" } : undefined} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight"><AnimatedCounter value={currentStreak} /></p>
                {currentStreak > 0 && (
                  <div className="relative h-8 w-6">
                    <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400 absolute bottom-0 left-0" style={{ animation: "streakFlicker 1.5s ease-in-out infinite" }} />
                    <Flame className="h-3 w-3 text-amber-400/80 absolute bottom-1 left-2" style={{ animation: "streakFlicker 1.2s ease-in-out 0.3s infinite" }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* In Danger (Rose) */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200/60 shadow-sm hover:shadow-md hover:shadow-rose-500/15 hover:border-rose-300
            dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.07] dark:hover:border-rose-500/30 dark:hover:shadow-lg dark:hover:shadow-rose-500/15">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{isCurrent ? "In Danger" : "Failed"}</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-110 ${dangerCount > 0 ? "bg-rose-100 text-rose-600 group-hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:group-hover:bg-rose-500/20" : "bg-teal-100 text-teal-600 group-hover:bg-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:group-hover:bg-teal-500/20"}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <p className={`text-3xl font-extrabold tracking-tight ${dangerCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}><AnimatedCounter value={dangerCount} /></p>
            </div>
          </div>
        </StaggerGrid>
      )}

      {/* Goal Mode Card */}
      {isCurrent && goalPlan && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 120ms forwards" }}>
          {goalPlan.goalEnabled && goalPlan.todaysPlan.length > 0 ? (
            <div className="rounded-2xl border overflow-hidden transition-all
              bg-white border-gray-200/60 shadow-sm hover:shadow-md
              dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:hover:bg-white/[0.06]">
              <button
                onClick={() => setGoalExpanded(!goalExpanded)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 dark:text-white">Today&apos;s Goal Plan</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Attend {goalPlan.summary.mustAttend} of {goalPlan.summary.total} to stay on track
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
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
                        "flex items-center gap-3 p-3 rounded-xl border transition",
                        cls.priority === "mandatory" ? "border-rose-200 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/5" :
                        cls.priority === "recommended" ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5" :
                        "border-teal-200 bg-teal-50/50 dark:border-teal-500/30 dark:bg-teal-500/5"
                      )}
                    >
                      <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: cls.colorHex }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{cls.subjectName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" /> {cls.startTime} - {cls.endTime}
                          {cls.room && <><MapPin className="w-3 h-3 ml-1" /> {cls.room}</>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={clsx(
                          "text-xs font-bold px-2.5 py-1 rounded-lg",
                          cls.priority === "mandatory" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
                          cls.priority === "recommended" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                          "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
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
            <Link href="/settings/goal" className="group relative flex items-center justify-between rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer
              bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200/60 shadow-sm hover:shadow-md hover:shadow-violet-500/10 hover:border-violet-300
              dark:from-violet-500/[0.05] dark:to-pink-500/[0.05] dark:border-white/[0.08] dark:backdrop-blur-xl dark:hover:from-violet-500/[0.08] dark:hover:to-pink-500/[0.08] dark:hover:border-violet-500/25">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 shadow-sm">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Set Your Attendance Goal</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Get a daily action plan showing which classes to attend</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ) : null}
        </div>
      )}

      {/* Today's Classes */}
      {isCurrent && todayClasses.length > 0 && (
        <div style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 150ms forwards" }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-violet-500" /> Today&apos;s Classes
          </h2>
          <StaggerGrid className="grid gap-3" delay={180} staggerDelay={80} animation="fadeSlideUp">
            {todayClasses.map((cls, i) => (
              <ScheduleCard key={cls.scheduleId} cls={cls} marking={markingId} onMark={quickMark} />
            ))}
          </StaggerGrid>
        </div>
      )}

      {/* Subject Cards */}
      {dashboard && subjectsList.length > 0 && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 200ms forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Subjects</h2>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{subjectsList.length} courses</span>
          </div>
          <StaggerGrid className="grid gap-4 md:grid-cols-2" delay={250} staggerDelay={80} animation="fadeSlideUp">
            {subjectsList.map((s: any, i: number) => {
              const percentage = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
              const min = s.minAttendancePct ?? 75;
              const statusLabel = isCurrent ? (percentage >= min ? "On track" : percentage >= min - 5 ? "At risk" : "Action needed") :
                                            (percentage >= min ? "Met requirement" : "Failed requirement");
              
              const accentColors = [
                { from: "from-violet-500", to: "to-pink-500", hover: "hover:border-violet-300 dark:hover:border-violet-500/30", shadow: "hover:shadow-violet-500/10" },
                { from: "from-blue-500", to: "to-cyan-500", hover: "hover:border-blue-300 dark:hover:border-blue-500/30", shadow: "hover:shadow-blue-500/10" },
                { from: "from-teal-500", to: "to-emerald-500", hover: "hover:border-teal-300 dark:hover:border-teal-500/30", shadow: "hover:shadow-teal-500/10" },
                { from: "from-orange-500", to: "to-amber-500", hover: "hover:border-orange-300 dark:hover:border-orange-500/30", shadow: "hover:shadow-orange-500/10" },
                { from: "from-pink-500", to: "to-rose-500", hover: "hover:border-pink-300 dark:hover:border-pink-500/30", shadow: "hover:shadow-pink-500/10" },
                { from: "from-cyan-500", to: "to-blue-500", hover: "hover:border-cyan-300 dark:hover:border-cyan-500/30", shadow: "hover:shadow-cyan-500/10" },
                { from: "from-rose-500", to: "to-pink-500", hover: "hover:border-rose-300 dark:hover:border-rose-500/30", shadow: "hover:shadow-rose-500/10" },
              ];
              const accent = accentColors[i % accentColors.length];
              const barColorStyle = s.colorHex ? { backgroundColor: s.colorHex, backgroundImage: 'none' } : {};

              return (
              <Link key={s.id} href={`/subjects/${s.id}`}
                className={`group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer block
                  bg-white border border-gray-200/60 border-l-4 shadow-sm hover:shadow-md ${accent.shadow}
                  dark:bg-white/[0.04] dark:border-white/[0.08] dark:border-l-4 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.07] dark:hover:shadow-lg
                  ${accent.hover}`}
                style={{ borderLeftColor: s.colorHex || undefined }}
              >
                {/* Top gradient line */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                
                {/* Left accent bar */}
                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${accent.from} ${accent.to}`} style={barColorStyle} />
                
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0 pr-4">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">{s.name}</h3>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{s.code}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 mb-2">
                    <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          percentage >= 75
                            ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                            : percentage >= 60
                            ? "bg-gradient-to-r from-orange-500 to-amber-400"
                            : "bg-gradient-to-r from-rose-500 to-pink-400"
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-sm font-extrabold ${
                      percentage >= 75 ? "text-teal-600 dark:text-teal-400" :
                      percentage >= 60 ? "text-orange-600 dark:text-orange-400" :
                      "text-rose-600 dark:text-rose-400"
                    }`}>
                      {percentage}%
                    </span>
                    <span className={`text-xs font-semibold ${
                      percentage >= 75 ? "text-teal-700 dark:text-teal-400/80" :
                      percentage >= 60 ? "text-orange-700 dark:text-orange-400/80" :
                      "text-rose-700 dark:text-rose-400/80"
                    }`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" /> {s.totalPresent ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </StaggerGrid>
        </div>
      )}

      {/* Empty state */}
      {dashboard && totalSubjects === 0 && (
        <div className="text-center py-16 rounded-2xl bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 100ms forwards" }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No subjects yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Add your first subject to start tracking attendance</p>

          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="btn-gradient px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold shadow-md shadow-violet-500/20">
            <Plus className="w-5 h-5" /> Add Your First Subject
          </Link>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-3">or</p>
          <div className="flex flex-col gap-2 mt-2 items-center">
            {isCurrent && activeSemId && (
              <button onClick={() => setShowImportSubjects(true)} className="btn-gradient-cyan px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full max-w-xs font-bold cursor-pointer">
                <Download className="w-5 h-5" /> Import Existing Subjects
              </button>
            )}
            <Link href="/import" className="px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 dark:border-white/10 transition w-full max-w-xs font-medium">
              <Camera className="w-5 h-5" /> Import from Timetable Photo
            </Link>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportSubjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImportSubjects(false)}>
          <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl bg-white border-gray-200 dark:border-white/10 dark:bg-[#0f172a] dark:backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Import Subjects</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
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
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
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
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
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
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No subjects available to import</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">All subjects are already in this semester</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {selectedImports.size > 0 ? `${selectedImports.size} subject${selectedImports.size > 1 ? "s" : ""} selected` : "Select subjects to import"}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowImportSubjects(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleImport} disabled={selectedImports.size === 0 || importing}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{subject.name}</p>
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

