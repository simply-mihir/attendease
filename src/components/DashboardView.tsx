"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,
  Timer, TrendingUp, BookOpen, ArrowRight, Sparkles, Zap, Ban, Target, ChevronDown, Camera, Download
} from "lucide-react";
import clsx from "clsx";
import { ScheduleCard } from "@/components/MemoizedScheduleCard";
import { MarkingProgressBar } from "@/components/MarkingProgressBar";
import { ParticleBurst } from "@/components/ParticleBurst";
import { StreakFlame } from "@/components/StreakFlame";
import { AnimatedCounter } from "@/components/AnimatedCounter";
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
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <MarkingProgressBar isActive={markingStatus.active} status={markingStatus.status} />
      <ParticleBurst trigger={particleBurst.trigger} x={particleBurst.x} y={particleBurst.y} type={particleBurst.type} />
      {/* Header */}
      <div className="flex items-center justify-between" style={{ animation: "dash-in 0.4s ease-out both" }}>
        <div>
          <h1 className="text-2xl font-bold text-gradient text-shimmer">
            {dashboard?.semesterName ? dashboard.semesterName : `Hello ${displayName}`}
          </h1>
          <p className="text-text-secondary text-sm">
            {today?.dayName}, {today?.date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCurrent && activeSemId && (
            <button
              onClick={() => setShowImportSubjects(true)}
              className="btn-gradient-cyan px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Import
            </button>
          )}
          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="btn-gradient px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes dash-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Orphan Subjects Banner */}
      {dashboard?.orphanCount && dashboard.orphanCount > 0 && isCurrent && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-4 mb-6" style={{ animation: "dash-in 0.4s ease-out 0.05s both" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 text-sm">
                ⚠️
              </div>
              <p className="text-sm text-gray-300">
                You have <strong className="text-amber-300">{dashboard.orphanCount} subject{dashboard.orphanCount > 1 ? "s" : ""}</strong> not assigned to any semester.
              </p>
            </div>
            <button
              onClick={() => setShowImportSubjects(true)}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {/* Semester Banners */}
      {!activeSemester && !dashLoading && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl p-5 mb-6" style={{ animation: "dash-in 0.4s ease-out 0.05s both" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              🎓
            </div>
            <div>
              <h3 className="font-semibold text-purple-300">Welcome to AttendEase</h3>
              <p className="text-sm text-gray-400">Set up your current semester to start tracking classes.</p>
            </div>
            <Link
              href="/semesters/new"
              className="ml-auto rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Start Semester
            </Link>
          </div>
        </div>
      )}

      {semesterEnded && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-5 mb-6" style={{ animation: "dash-in 0.4s ease-out 0.05s both" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              📅
            </div>
            <div>
              <h3 className="font-semibold text-amber-300">Semester Ended</h3>
              <p className="text-sm text-gray-400">
                {activeSemester.name} ended on {new Date(activeSemester.endDate).toLocaleDateString()}. 
                Start a new semester to track attendance for new courses.
              </p>
            </div>
            <Link
              href="/semesters/new"
              className="ml-auto rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              New Semester
            </Link>
          </div>
        </div>
      )}

      {currentExam && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl p-5 mb-6" style={{ animation: "dash-in 0.4s ease-out 0.05s both" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              📝
            </div>
            <div>
              <h3 className="font-semibold text-blue-300">Exam Period</h3>
              <p className="text-sm text-gray-400">
                {currentExam.name} — classes cancelled until {new Date(currentExam.endDate).toLocaleDateString()}. Good luck!
              </p>
            </div>
          </div>
        </div>
      )}

      {todayHoliday && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-5 mb-6" style={{ animation: "dash-in 0.4s ease-out 0.05s both" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              🎉
            </div>
            <div>
              <h3 className="font-semibold text-emerald-300">{todayHoliday.name}</h3>
              <p className="text-sm text-gray-400">Holiday today — no classes scheduled. Enjoy!</p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Alert */}
      {isCurrent && dangerSubjectsList.length > 0 && (
        <div className="glass rounded-2xl p-4 flex items-start gap-3 border-red-500/30 animated-border animate-shake" style={{ animation: "dash-in 0.4s ease-out 0.05s both" }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-red-400 text-sm">Attendance Danger Zone</p>
            <p className="text-sm text-text-secondary mt-1">
              {dangerSubjectsList.map((s) => s.name).join(", ")} — below minimum threshold. Attend classes immediately!
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 card-stagger" style={{ animation: "dash-in 0.4s ease-out 0.1s both" }}>
          <StatCard label="Overall" value={<AnimatedCounter value={overallPct} suffix="%" />}
            icon={<TrendingUp className="w-5 h-5" />}
            gradient={overallPct >= 75 ? "from-green-500 to-emerald-500" : "from-red-500 to-orange-500"} />
          <StatCard label="Subjects" value={<AnimatedCounter value={totalSubjects} />}
            icon={<BookOpen className="w-5 h-5" />} gradient="from-cyan-500 to-blue-500" />
          <StatCard label="Streak" value={<span className="flex items-center gap-1"><AnimatedCounter value={currentStreak} /><StreakFlame streak={currentStreak} size="sm" /></span>}
            icon={<Flame className="w-5 h-5" />} gradient="from-orange-500 to-yellow-500" />
          <StatCard label={isCurrent ? "In Danger" : "Failed"} value={<AnimatedCounter value={dangerCount} />}
            icon={<Zap className="w-5 h-5" />}
            gradient={dangerCount > 0 ? "from-red-500 to-pink-500" : "from-green-500 to-cyan-500"} />
        </div>
      )}

      {/* Goal Mode Card */}
      {isCurrent && goalPlan && (
        <div style={{ animation: "dash-in 0.4s ease-out 0.12s both" }}>
          {goalPlan.goalEnabled && goalPlan.todaysPlan.length > 0 ? (
            <div className="glass rounded-2xl overflow-hidden">
              <button
                onClick={() => setGoalExpanded(!goalExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-text text-sm">Today&apos;s Goal Plan</h3>
                    <p className="text-xs text-text-muted">
                      Attend {goalPlan.summary.mustAttend} of {goalPlan.summary.total} to stay on track for {goalPlan.goalPct}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {goalPlan.goalPct}% goal
                  </span>
                  <ChevronDown className={clsx("w-4 h-4 text-text-muted transition-transform", goalExpanded && "rotate-180")} />
                </div>
              </button>
              {goalExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {goalPlan.todaysPlan.map((cls) => (
                    <div
                      key={cls.scheduleId}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition",
                        cls.priority === "mandatory" ? "border-red-500/30 bg-red-500/5" :
                        cls.priority === "recommended" ? "border-yellow-500/30 bg-yellow-500/5" :
                        "border-green-500/30 bg-green-500/5"
                      )}
                    >
                      <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: cls.colorHex }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-text truncate">{cls.subjectName}</p>
                        <p className="text-xs text-text-muted flex items-center gap-2">
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
            <Link href="/settings/goal" className="glass rounded-2xl p-4 flex items-center gap-3 hover:bg-surface-3 transition group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-text">Set Your Attendance Goal</p>
                <p className="text-xs text-text-muted">Get a daily action plan showing which classes to attend</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : null}
        </div>
      )}

      {/* Today's Classes */}
      {isCurrent && todayClasses.length > 0 && (
        <div style={{ animation: "dash-in 0.4s ease-out 0.15s both" }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-text">
            <Sparkles className="w-5 h-5 text-purple-400" /> Today&apos;s Classes
          </h2>
          <div className="grid gap-3 card-stagger">
            {todayClasses.map((cls, i) => (
              <div key={cls.scheduleId}
                style={{ animation: `dash-in 0.35s ease-out ${0.18 + i * 0.05}s both` }}>
                <ScheduleCard cls={cls} marking={markingId} onMark={quickMark} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Cards */}
      {dashboard && subjectsList.length > 0 && (
        <div style={{ animation: "dash-in 0.4s ease-out 0.2s both" }}>
          <h2 className="text-lg font-semibold mb-3 text-text">All Subjects</h2>
          <div className="grid gap-3 md:grid-cols-2 card-stagger">
            {subjectsList.map((s: any, i: number) => {
              // Handle both new and old properties
              const pct = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
              const min = s.minAttendancePct ?? 75;
              const color = s.statusColor || (pct >= min ? "green" : (pct >= min - 5 ? "yellow" : "red"));
              
              return (
              <Link key={s.id} href={`/subjects/${s.id}`}
                className="glass rounded-2xl p-4 hover:bg-glass-strong transition-all group"
                style={{ animation: `dash-in 0.35s ease-out ${0.25 + i * 0.04}s both` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: s.colorHex, boxShadow: `0 0 10px ${s.colorHex}30` }} />
                    <div>
                      <h3 className="font-semibold group-hover:text-purple-400 transition text-text">{s.name}</h3>
                      {s.code && <p className="text-xs text-text-muted">{s.code}</p>}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className={clsx("h-full rounded-full transition-all",
                    color === "green" ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                    color === "yellow" ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
                    "bg-gradient-to-r from-red-500 to-pink-400"
                  )} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={clsx("font-semibold",
                    color === "green" ? "text-green-400" : color === "yellow" ? "text-yellow-400" : "text-red-400"
                  )}>{pct}%</span>
                  <span className="text-text-muted text-xs">
                    {isCurrent ? (
                      color === "red" ? `Action needed` : `On track`
                    ) : (
                       color === "red" ? `Failed requirement` : `Met requirement`
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {(s.totalCancelled ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400 font-bold bg-slate-500/10 px-2 py-0.5 rounded-md">
                        <Ban className="w-3 h-3" /> {s.totalCancelled}
                      </span>
                    )}
                    {(s.streakCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-md">
                        <Flame className="w-3 h-3" />{s.streakCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )})}
          </div>
        </div>
      )}

      {/* Empty state */}
      {dashboard && totalSubjects === 0 && (
        <div className="text-center py-16 glass rounded-2xl" style={{ animation: "dash-in 0.4s ease-out 0.1s both" }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-text">No subjects yet</h2>
          <p className="text-text-secondary mb-6">Add your first subject to start tracking attendance</p>
          <Link href={`/subjects/new${semesterId ? `?semesterId=${semesterId}` : ""}`} className="btn-gradient px-6 py-3 rounded-xl inline-flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Your First Subject
          </Link>
          <p className="text-text-muted text-sm mt-3">or</p>
          <div className="flex flex-col gap-2 mt-2 items-center">
            {isCurrent && activeSemId && (
              <button onClick={() => setShowImportSubjects(true)} className="btn-gradient-cyan px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full max-w-xs">
                <Download className="w-5 h-5" /> Import Existing Subjects
              </button>
            )}
            <Link href="/import" className="glass px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 hover:bg-surface-3 transition w-full max-w-xs">
              <Camera className="w-5 h-5" /> Import from Timetable Photo
            </Link>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportSubjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImportSubjects(false)}>
          <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Import Subjects</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add existing subjects to this semester
              </p>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingImportable ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-white/5" />
                  ))}
                </div>
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
            <div className="p-6 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedImports.size > 0 ? `${selectedImports.size} subject${selectedImports.size > 1 ? "s" : ""} selected` : "Select subjects to import"}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowImportSubjects(false)} className="rounded-xl px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
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
    </div>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: React.ReactNode; icon: React.ReactNode; gradient: string }) {
  return (
    <div className="glass rounded-2xl p-4 hover:bg-glass-strong transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary text-sm">{label}</span>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
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
