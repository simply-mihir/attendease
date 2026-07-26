"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import {
  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,
  Timer, TrendingUp, BookOpen, ArrowRight, Sparkles, Zap, Ban
} from "lucide-react";
import clsx from "clsx";

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
  totalClasses: number; minAttendancePct: number;
}

interface DashboardData {
  overallPct: number; totalSubjects: number; safeSubjects: number;
  warningSubjects: number; dangerSubjects: number; currentStreak: number;
  subjectsSummary: SubjectSummary[];
}

export default function DashboardPage() {
  const [today, setToday] = useState<{ date: string; dayName: string; classes: TodayClass[] } | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([apiFetch("/schedules/today"), apiFetch("/analytics/dashboard")]);
      setToday(t); setDashboard(d);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function quickMark(subjectId: string, scheduleId: string, status: string) {
    setMarking(`${subjectId}-${status}`);
    try {
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({ subjectId, scheduleId, date: new Date().toISOString().slice(0, 10), status, source: "quick_widget" }),
      });
      await loadData();
    } catch (err) { console.error(err); }
    finally { setMarking(null); }
  }

  const dangerSubjects = dashboard?.subjectsSummary.filter((s) => s.statusColor === "red") || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Dashboard</h1>
          <p className="text-text-secondary text-sm">{today?.dayName}, {today?.date}</p>
        </div>
        <Link href="/subjects/new" className="btn-gradient px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </Link>
      </div>

      {/* Danger Alert */}
      {dangerSubjects.length > 0 && (
        <div className="glass rounded-2xl p-4 flex items-start gap-3 border-red-500/30">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-red-400 text-sm">Attendance Danger Zone</p>
            <p className="text-sm text-text-secondary mt-1">
              {dangerSubjects.map((s) => s.name).join(", ")} — below minimum threshold. Attend classes immediately!
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Overall" value={`${dashboard.overallPct}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            gradient={dashboard.overallPct >= 75 ? "from-green-500 to-emerald-500" : "from-red-500 to-orange-500"} />
          <StatCard label="Subjects" value={dashboard.totalSubjects.toString()}
            icon={<BookOpen className="w-5 h-5" />} gradient="from-cyan-500 to-blue-500" />
          <StatCard label="Streak" value={`${dashboard.currentStreak}d`}
            icon={<Flame className="w-5 h-5" />} gradient="from-orange-500 to-yellow-500" />
          <StatCard label="In Danger" value={dashboard.dangerSubjects.toString()}
            icon={<Zap className="w-5 h-5" />}
            gradient={dashboard.dangerSubjects > 0 ? "from-red-500 to-pink-500" : "from-green-500 to-cyan-500"} />
        </div>
      )}

      {/* Today's Classes */}
      {today && today.classes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-text">
            <Sparkles className="w-5 h-5 text-purple-400" /> Today&apos;s Classes
          </h2>
          <div className="grid gap-3">
            {today.classes.map((cls) => (
              <div key={cls.scheduleId} className="glass rounded-2xl p-4 hover:bg-glass-strong transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: cls.colorHex, boxShadow: `0 0 12px ${cls.colorHex}40` }} />
                    <div>
                      <h3 className="font-semibold text-text">{cls.subjectName}</h3>
                      <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.startTime} - {cls.endTime}</span>
                        {cls.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cls.room}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={clsx("text-xl font-bold",
                      cls.statusColor === "green" ? "text-green-400" : cls.statusColor === "yellow" ? "text-yellow-400" : "text-red-400"
                    )}>
                      {cls.currentPct}%
                    </span>
                    <p className="text-xs text-text-muted">min {cls.minPct}%</p>
                  </div>
                </div>

                {cls.attendanceMarked ? (
                  <div className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium",
                    cls.attendanceStatus === "present" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    cls.attendanceStatus === "late" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                    cls.attendanceStatus === "cancelled" ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" :
                    "bg-red-500/10 text-red-400 border border-red-500/20"
                  )}>
                    <CheckCircle2 className="w-4 h-4" />
                    Marked: {cls.attendanceStatus}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {(["present", "absent", "late", "cancelled"] as const).map((status) => (
                      <button key={status} onClick={() => quickMark(cls.subjectId, cls.scheduleId, status)}
                        disabled={marking === `${cls.subjectId}-${status}`}
                        className={clsx("py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1",
                          status === "present" ? "glass border-green-500/20 text-green-400 hover:bg-green-500/10" :
                          status === "absent" ? "glass border-red-500/20 text-red-400 hover:bg-red-500/10" :
                          status === "late" ? "glass border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10" :
                          "glass border-slate-500/20 text-slate-400 hover:bg-slate-500/10"
                        )}>
                        {status === "present" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         status === "absent" ? <XCircle className="w-3.5 h-3.5" /> :
                         status === "late" ? <Timer className="w-3.5 h-3.5" /> :
                         <Ban className="w-3.5 h-3.5" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Cards */}
      {dashboard && dashboard.subjectsSummary.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-text">All Subjects</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {dashboard.subjectsSummary.map((s) => (
              <Link key={s.id} href={`/subjects/${s.id}`}
                className="glass rounded-2xl p-4 hover:bg-glass-strong transition-all group">
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
                    s.statusColor === "green" ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                    s.statusColor === "yellow" ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
                    "bg-gradient-to-r from-red-500 to-pink-400"
                  )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={clsx("font-semibold",
                    s.statusColor === "green" ? "text-green-400" : s.statusColor === "yellow" ? "text-yellow-400" : "text-red-400"
                  )}>{s.currentPercentage}%</span>
                  <span className="text-text-muted text-xs">
                    {s.statusColor === "red" ? `Attend ${s.mustAttendCount} more` : `Can skip ${s.canSkipCount}`}
                  </span>
                  {s.streakCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <Flame className="w-3 h-3" />{s.streakCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {dashboard && dashboard.totalSubjects === 0 && (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-text">No subjects yet</h2>
          <p className="text-text-secondary mb-6">Add your first subject to start tracking attendance</p>
          <Link href="/subjects/new" className="btn-gradient px-6 py-3 rounded-xl inline-flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Your First Subject
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: string; icon: React.ReactNode; gradient: string }) {
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
