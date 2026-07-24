"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import {
  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,
  Timer, TrendingUp, BookOpen, ArrowRight
} from "lucide-react";
import clsx from "clsx";

interface TodayClass {
  scheduleId: string;
  subjectId: string;
  subjectName: string;
  colorHex: string;
  startTime: string;
  endTime: string;
  room: string | null;
  currentPct: number;
  minPct: number;
  statusColor: string;
  streakCount: number;
  attendanceMarked: boolean;
  attendanceStatus: string | null;
}

interface SubjectSummary {
  id: string;
  name: string;
  code: string | null;
  colorHex: string;
  currentPercentage: number;
  statusColor: string;
  statusLabel: string;
  canSkipCount: number;
  mustAttendCount: number;
  streakCount: number;
  totalClasses: number;
  minAttendancePct: number;
}

interface DashboardData {
  overallPct: number;
  totalSubjects: number;
  safeSubjects: number;
  warningSubjects: number;
  dangerSubjects: number;
  currentStreak: number;
  subjectsSummary: SubjectSummary[];
}

export default function DashboardPage() {
  const [today, setToday] = useState<{ date: string; dayName: string; classes: TodayClass[] } | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([
        apiFetch("/schedules/today"),
        apiFetch("/analytics/dashboard"),
      ]);
      setToday(t);
      setDashboard(d);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function quickMark(subjectId: string, scheduleId: string, status: string) {
    setMarking(`${subjectId}-${status}`);
    try {
      const todayDate = new Date().toISOString().slice(0, 10);
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({ subjectId, scheduleId, date: todayDate, status, source: "quick_widget" }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(null);
    }
  }

  const dangerSubjects = dashboard?.subjectsSummary.filter((s) => s.statusColor === "red") || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-text-secondary text-sm">{today?.dayName}, {today?.date}</p>
        </div>
        <Link href="/subjects/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          <Plus className="w-4 h-4" /> Add Subject
        </Link>
      </div>

      {/* Danger Alert */}
      {dangerSubjects.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-danger text-sm">Attendance Danger Zone</p>
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
            color={dashboard.overallPct >= 75 ? "text-success" : "text-danger"} />
          <StatCard label="Subjects" value={dashboard.totalSubjects.toString()}
            icon={<BookOpen className="w-5 h-5" />} color="text-primary" />
          <StatCard label="Streak" value={`${dashboard.currentStreak} days`}
            icon={<Flame className="w-5 h-5" />} color="text-warning" />
          <StatCard label="In Danger" value={dashboard.dangerSubjects.toString()}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={dashboard.dangerSubjects > 0 ? "text-danger" : "text-success"} />
        </div>
      )}

      {/* Today's Classes */}
      {today && today.classes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Today&apos;s Classes</h2>
          <div className="grid gap-3">
            {today.classes.map((cls) => (
              <div key={cls.scheduleId} className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-10 rounded-full" style={{ backgroundColor: cls.colorHex }} />
                    <div>
                      <h3 className="font-semibold">{cls.subjectName}</h3>
                      <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.startTime} - {cls.endTime}</span>
                        {cls.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cls.room}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={clsx("text-lg font-bold", cls.statusColor === "green" ? "text-success" : cls.statusColor === "yellow" ? "text-warning" : "text-danger")}>
                      {cls.currentPct}%
                    </span>
                    <p className="text-xs text-text-muted">min {cls.minPct}%</p>
                  </div>
                </div>

                {cls.attendanceMarked ? (
                  <div className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                    cls.attendanceStatus === "present" ? "bg-success/10 text-success" :
                    cls.attendanceStatus === "late" ? "bg-warning/10 text-warning" :
                    "bg-danger/10 text-danger"
                  )}>
                    <CheckCircle2 className="w-4 h-4" />
                    Marked: {cls.attendanceStatus}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {["present", "absent", "late"].map((status) => (
                      <button key={status} onClick={() => quickMark(cls.subjectId, cls.scheduleId, status)}
                        disabled={marking === `${cls.subjectId}-${status}`}
                        className={clsx("flex-1 py-2 rounded-lg text-sm font-medium transition border",
                          status === "present" ? "border-success/30 text-success hover:bg-success/10" :
                          status === "absent" ? "border-danger/30 text-danger hover:bg-danger/10" :
                          "border-warning/30 text-warning hover:bg-warning/10"
                        )}>
                        {status === "present" ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> :
                         status === "absent" ? <XCircle className="w-4 h-4 inline mr-1" /> :
                         <Timer className="w-4 h-4 inline mr-1" />}
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
          <h2 className="text-lg font-semibold mb-3">All Subjects</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {dashboard.subjectsSummary.map((s) => (
              <Link key={s.id} href={`/subjects/${s.id}`}
                className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-8 rounded-full" style={{ backgroundColor: s.colorHex }} />
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition">{s.name}</h3>
                      {s.code && <p className="text-xs text-text-muted">{s.code}</p>}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition" />
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-2">
                  <div className={clsx("h-full rounded-full transition-all",
                    s.statusColor === "green" ? "bg-success" : s.statusColor === "yellow" ? "bg-warning" : "bg-danger"
                  )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={clsx("font-semibold",
                    s.statusColor === "green" ? "text-success" : s.statusColor === "yellow" ? "text-warning" : "text-danger"
                  )}>
                    {s.currentPercentage}%
                  </span>
                  <span className="text-text-muted text-xs">
                    {s.statusColor === "red"
                      ? `Attend ${s.mustAttendCount} more`
                      : `Can skip ${s.canSkipCount}`}
                  </span>
                  {s.streakCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-warning">
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
        <div className="text-center py-16 bg-surface rounded-xl border border-border">
          <BookOpen className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No subjects yet</h2>
          <p className="text-text-secondary mb-6">Add your first subject to start tracking attendance</p>
          <Link href="/subjects/new" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition">
            <Plus className="w-5 h-5" /> Add Your First Subject
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary text-sm">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={clsx("text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}
