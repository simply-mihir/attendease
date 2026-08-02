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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hello, <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:via-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {dashboard?.semesterName 
            ? `Your attendance report for ${dashboard.semesterName} is ready. Let's make every class count!` 
            : "Here is your attendance overview. Let's make every class count!"} 
          <span className="mx-2 opacity-50">·</span>
          {today?.date}
        </p>
      </div>

      {/* Semester Banner */}
      <div className="relative mb-6 flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none p-5 overflow-hidden gap-4" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{dashboard?.semesterName || "All Semesters"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{today?.dayName}, {today?.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCurrent && activeSemId && (
            <button
              onClick={() => setShowImportSubjects(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <ArrowDown className="h-4 w-4" /> Import
            </button>
          )}
          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Add Subject
          </Link>
        </div>
      </div>

      {todayHoliday && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:backdrop-blur-xl p-5 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 50ms forwards" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">{todayHoliday.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Holiday today — no classes scheduled. Enjoy!</p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Alert */}
      {isCurrent && dangerSubjectsList.length > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3 bg-red-50 border border-red-200 dark:bg-red-500/5 dark:border-red-500/20" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 50ms forwards" }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-red-600 dark:text-red-400 text-sm">Attendance Danger Zone</p>
            <p className="text-sm text-red-500/80 dark:text-gray-400 mt-1">
              {dangerSubjectsList.map((s) => s.name).join(", ")} — below minimum threshold. Attend classes immediately!
            </p>
          </div>
        </div>
      )}

                  {/* Stats Row */}
      {dashboard && (
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={100} staggerDelay={80} animation="fadeSlideUp">
          {/* Overall */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-emerald-500/10 hover:border-emerald-300
            dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-emerald-500/20 dark:hover:shadow-lg dark:hover:shadow-emerald-500/10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-emerald-500/[0.03]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Overall</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white"><AnimatedCounter value={overallPct} suffix="%" /></p>
            </div>
          </div>

          {/* Subjects */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-300
            dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-blue-500/20 dark:hover:shadow-lg dark:hover:shadow-blue-500/10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-blue-500/[0.03]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Subjects</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white"><AnimatedCounter value={totalSubjects} /></p>
            </div>
          </div>

          {/* Streak */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-amber-500/10 hover:border-amber-300
            dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-amber-500/20 dark:hover:shadow-lg dark:hover:shadow-amber-500/10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-amber-500/[0.03]" />
            {currentStreak > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" style={{ animation: "streakGlow 2s ease-in-out infinite" }} />
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Streak</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20 transition-colors">
                  <Flame className="h-5 w-5" style={currentStreak > 0 ? { animation: "streakFlicker 1.5s ease-in-out infinite" } : undefined} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white"><AnimatedCounter value={currentStreak} /></p>
                {currentStreak > 0 && (
                  <div className="relative h-8 w-6">
                    <Flame className="h-5 w-5 text-amber-500 dark:text-amber-400 absolute bottom-0 left-0" style={{ animation: "streakFlicker 1.5s ease-in-out infinite" }} />
                    <Flame className="h-3 w-3 text-orange-400/60 absolute bottom-1 left-2" style={{ animation: "streakFlicker 1.2s ease-in-out 0.3s infinite" }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* In Danger */}
          <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
            bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-red-500/10 hover:border-red-300
            dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-red-500/20 dark:hover:shadow-lg dark:hover:shadow-red-500/10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-red-500/[0.03]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{isCurrent ? "In Danger" : "Failed"}</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${dangerCount > 0 ? "bg-red-100 text-red-600 group-hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:group-hover:bg-red-500/20" : "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500/20"}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <p className={`text-3xl font-bold ${dangerCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}><AnimatedCounter value={dangerCount} /></p>
            </div>
          </div>
        </StaggerGrid>
      )}

                  {/* Goal Mode Card */}
      {isCurrent && goalPlan && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 120ms forwards" }}>
          {goalPlan.goalEnabled && goalPlan.todaysPlan.length > 0 ? (
            <div className="rounded-xl border overflow-hidden transition-all
              bg-white border-gray-200 shadow-sm hover:shadow-md
              dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:hover:bg-white/[0.05] dark:hover:border-white/20">
              <button
                onClick={() => setGoalExpanded(!goalExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Today&apos;s Goal Plan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Attend {goalPlan.summary.mustAttend} of {goalPlan.summary.total} to stay on track
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
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
                        cls.priority === "mandatory" ? "border-red-500/30 bg-red-500/5" :
                        cls.priority === "recommended" ? "border-yellow-500/30 bg-yellow-500/5" :
                        "border-green-500/30 bg-green-500/5"
                      )}
                    >
                      <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: cls.colorHex }} />
                      <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{cls.subjectName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {cls.startTime} - {cls.endTime}
                          {cls.room && <><MapPin className="w-3 h-3 ml-1" /> {cls.room}</>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={clsx(
                          "text-xs font-black px-2 py-1 rounded-lg",
                          cls.priority === "mandatory" ? "bg-red-500/10 text-red-400" :
                          cls.priority === "recommended" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-green-500/10 text-green-400"
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
              bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 shadow-sm hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-300
              dark:from-purple-500/[0.04] dark:to-violet-500/[0.04] dark:border-white/10 dark:backdrop-blur-xl dark:hover:from-purple-500/[0.08] dark:hover:to-violet-500/[0.08] dark:hover:border-purple-500/20 dark:hover:shadow-lg dark:hover:shadow-purple-500/10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Set Your Attendance Goal</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get a daily action plan showing which classes to attend</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ) : null}
        </div>
      )}

      {/* Today's Classes */}
      {isCurrent && todayClasses.length > 0 && (
        <div style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 150ms forwards" }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-purple-400" /> Today&apos;s Classes
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Subjects</h2>
            <span className="text-sm text-gray-400 dark:text-gray-500">{subjectsList.length} courses</span>
          </div>
          <StaggerGrid className="grid gap-4 md:grid-cols-2" delay={250} staggerDelay={80} animation="fadeSlideUp">
            {subjectsList.map((s: any, i: number) => {
              const percentage = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
              const min = s.minAttendancePct ?? 75;
              const statusLabel = isCurrent ? (percentage >= min ? "On track" : percentage >= min - 5 ? "At risk" : "Action needed") :
                                            (percentage >= min ? "Met requirement" : "Failed requirement");
              
              const accentColors = [
                { from: "from-purple-500", to: "to-violet-600", hover: "hover:border-purple-500/20", shadow: "hover:shadow-purple-500/10", track: "bg-purple-500/20" },
                { from: "from-blue-500", to: "to-indigo-600", hover: "hover:border-blue-500/20", shadow: "hover:shadow-blue-500/10", track: "bg-blue-500/20" },
                { from: "from-emerald-500", to: "to-green-600", hover: "hover:border-emerald-500/20", shadow: "hover:shadow-emerald-500/10", track: "bg-emerald-500/20" },
                { from: "from-amber-500", to: "to-orange-600", hover: "hover:border-amber-500/20", shadow: "hover:shadow-amber-500/10", track: "bg-amber-500/20" },
                { from: "from-pink-500", to: "to-rose-600", hover: "hover:border-pink-500/20", shadow: "hover:shadow-pink-500/10", track: "bg-pink-500/20" },
                { from: "from-cyan-500", to: "to-teal-600", hover: "hover:border-cyan-500/20", shadow: "hover:shadow-cyan-500/10", track: "bg-cyan-500/20" },
                { from: "from-red-500", to: "to-rose-600", hover: "hover:border-red-500/20", shadow: "hover:shadow-red-500/10", track: "bg-red-500/20" },
              ];
              const accent = accentColors[i % accentColors.length];
              const barColorStyle = s.colorHex ? { backgroundColor: s.colorHex, backgroundImage: 'none' } : {};

              return (
              <Link key={s.id} href={`/subjects/${s.id}`}
                className={`group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer block
                  bg-white border border-gray-200 border-l-4 shadow-sm hover:shadow-md ${accent.shadow}
                  dark:bg-white/[0.03] dark:border-white/10 dark:border-l-4 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:shadow-lg
                  ${accent.hover}`}
                style={{ borderLeftColor: s.colorHex || undefined }}
              >
                {/* Top gradient line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                
                {/* Left accent bar — gradient */}
                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${accent.from} ${accent.to}`} style={barColorStyle} />
                
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0 pr-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors truncate">{s.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.code}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  {/* Progress bar — glass track + gradient fill */}
                  <div className="mt-3 mb-2">
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          percentage >= 75
                            ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400"
                            : percentage >= 60
                            ? "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-red-600 via-red-500 to-rose-400"
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${
                      percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                      percentage >= 60 ? "text-amber-600 dark:text-amber-400" :
                      "text-red-600 dark:text-red-400"
                    }`}>
                      {percentage}%
                    </span>
                    <span className={`text-xs font-medium ${
                      percentage >= 75 ? "text-emerald-500/70 dark:text-emerald-400/60" :
                      percentage >= 60 ? "text-amber-500/70 dark:text-amber-400/60" :
                      "text-red-500/70 dark:text-red-400/60"
                    }`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-500/70 dark:text-amber-400/70" /> {s.totalPresent ?? 0}
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
        <div className="text-center py-16 glass rounded-2xl" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 100ms forwards" }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No subjects yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first subject to start tracking attendance</p>

          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="btn-gradient px-6 py-3 rounded-xl inline-flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Your First Subject
          </Link>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-3">or</p>
          <div className="flex flex-col gap-2 mt-2 items-center">
            {isCurrent && activeSemId && (
              <button onClick={() => setShowImportSubjects(true)} className="btn-gradient-cyan px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full max-w-xs">
                <Download className="w-5 h-5" /> Import Existing Subjects
              </button>
            )}
            <Link href="/import" className="glass px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition w-full max-w-xs">
              <Camera className="w-5 h-5" /> Import from Timetable Photo
            </Link>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportSubjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImportSubjects(false)}>
          <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl bg-white border-gray-200 dark:border-white/10 dark:bg-gray-900/95 dark:backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Subjects</h3>
              <p className="text-sm text-gray-500 mt-1">
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
                      <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
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
                      <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
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
                      <p className="text-gray-500 text-sm">No subjects available to import</p>
                      <p className="text-gray-600 text-xs mt-1">All subjects are already in this semester</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedImports.size > 0 ? `${selectedImports.size} subject${selectedImports.size > 1 ? "s" : ""} selected` : "Select subjects to import"}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowImportSubjects(false)} className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleImport} disabled={selectedImports.size === 0 || importing}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        isSelected ? "border-purple-500/30 bg-purple-500/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
      }`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
        isSelected ? "border-purple-500 bg-purple-600" : "border-white/20 bg-white/5"
      }`}>
        {isSelected && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{subject.name}</p>
        <p className="text-xs text-gray-500">
          {semesterName ? `From ${semesterName}` : "Not assigned to any semester"}
          {subject._count?.attendanceRecords > 0 && ` · ${subject._count.attendanceRecords} records`}
        </p>
      </div>

      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onSwitchMode(); }}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
            mode === "move"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          }`}
        >
          {mode === "move" ? "Move" : "Copy"}
        </button>
      )}
    </div>
  );
}
