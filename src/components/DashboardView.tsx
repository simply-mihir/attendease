"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,
  Timer, TrendingUp, BookOpen, ArrowRight, Sparkles, Zap, Ban, Target, ChevronDown, Camera
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
          <Link href="/import" className="btn-gradient-cyan px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <Camera className="w-4 h-4" /> Import
          </Link>
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
          <Link href="/import" className="btn-gradient-cyan px-6 py-3 rounded-xl inline-flex items-center gap-2 mt-2">
            <Camera className="w-5 h-5" /> Import from Timetable Photo
          </Link>
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
