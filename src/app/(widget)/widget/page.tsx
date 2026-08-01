"use client";
import { useEffect, useState, useCallback } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import {
  Clock, MapPin, CheckCircle2, XCircle, Timer, Ban,
  AlertTriangle, ArrowRight, TrendingUp
, Smartphone } from "lucide-react";
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
  attendanceMarked: boolean;
  attendanceStatus: string | null;
}

interface DashboardData {
  overallPct: number;
  dangerSubjects: number;
  subjectsSummary: {
    id: string;
    name: string;
    colorHex: string;
    currentPercentage: number;
    statusColor: string;
    canSkipCount: number;
    mustAttendCount: number;
  }[];
}

export default function WidgetPage() {
  const [today, setToday] = useState<{
    date: string;
    dayName: string;
    classes: TodayClass[];
  } | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function quickMark(
    subjectId: string,
    scheduleId: string,
    status: string
  ) {
    setMarking(`${subjectId}-${status}`);
    try {
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({
          subjectId,
          scheduleId,
          date: new Date().toISOString().slice(0, 10),
          status,
          source: "widget",
        }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(null);
    }
  }

  // Find next upcoming class
  function getNextClass(): TodayClass | null {
    if (!today) return null;
    const unmarked = today.classes.filter((c) => !c.attendanceMarked);
    return unmarked.length > 0 ? unmarked[0] : null;
  }

  // Countdown string
  function getCountdown(startTime: string): string {
    const now = new Date();
    const [h, m] = startTime.split(":").map(Number);
    const classTime = new Date();
    classTime.setHours(h, m, 0, 0);
    const diff = classTime.getTime() - now.getTime();
    if (diff <= 0) return "Now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `in ${hrs}h ${remMins}m`;
  }

  if (loading) {
    return <FuturisticLoader variant="section" title="Loading widget..." Icon={Smartphone} />;
  }

  const nextClass = getNextClass();
  const dangerSubjects = dashboard?.subjectsSummary.filter(
    (s) => s.statusColor === "red"
  ) || [];

  return (
    <div className="space-y-3 animate-fade-in max-w-lg mx-auto">
      {/* Overall percentage */}
      {dashboard && (
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                dashboard.overallPct >= 75
                  ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/20"
                  : "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/20"
              )}
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-text">
                {dashboard.overallPct}%
              </p>
              <p className="text-xs text-text-muted font-semibold">
                Overall Attendance
              </p>
            </div>
          </div>
          {dashboard.dangerSubjects > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-500/10 text-red-400 border border-red-500/20">
              {dashboard.dangerSubjects} in danger
            </span>
          )}
        </div>
      )}

      {/* Next class card */}
      {nextClass && (
        <div className="glass rounded-2xl p-4 border-l-4" style={{ borderLeftColor: nextClass.colorHex }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                Next Class
              </p>
              <h3 className="font-black text-text text-lg">
                {nextClass.subjectName}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {getCountdown(nextClass.startTime)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {nextClass.startTime} - {nextClass.endTime}
            </span>
            {nextClass.room && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {nextClass.room}
              </span>
            )}
            <span
              className={clsx(
                "font-bold",
                nextClass.statusColor === "green"
                  ? "text-green-400"
                  : nextClass.statusColor === "yellow"
                  ? "text-yellow-400"
                  : "text-red-400"
              )}
            >
              {nextClass.currentPct}%
            </span>
          </div>
          {/* Quick mark buttons */}
          <div className="grid grid-cols-4 gap-2">
            {(["present", "absent", "late", "cancelled"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() =>
                    quickMark(
                      nextClass.subjectId,
                      nextClass.scheduleId,
                      status
                    )
                  }
                  disabled={marking === `${nextClass.subjectId}-${status}`}
                  className={clsx(
                    "py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1",
                    status === "present"
                      ? "glass border-green-500/20 text-green-400 hover:bg-green-500/10"
                      : status === "absent"
                      ? "glass border-red-500/20 text-red-400 hover:bg-red-500/10"
                      : status === "late"
                      ? "glass border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                      : "glass border-slate-500/20 text-slate-400 hover:bg-slate-500/10"
                  )}
                >
                  {status === "present" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : status === "absent" ? (
                    <XCircle className="w-3 h-3" />
                  ) : status === "late" ? (
                    <Timer className="w-3 h-3" />
                  ) : (
                    <Ban className="w-3 h-3" />
                  )}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Danger subjects strip */}
      {dangerSubjects.length > 0 && (
        <div>
          <p className="text-xs font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Danger Subjects
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dangerSubjects.map((s) => (
              <div
                key={s.id}
                className="glass rounded-xl px-3 py-2 flex items-center gap-2 shrink-0 border-red-500/20"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.colorHex }}
                />
                <span className="text-xs font-bold text-text whitespace-nowrap">
                  {s.name}
                </span>
                <span className="text-xs font-black text-red-400">
                  {s.currentPercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's remaining classes */}
      {today && today.classes.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-black text-text-muted uppercase tracking-wider mb-2">
            Today&apos;s Classes
          </p>
          <div className="space-y-2">
            {today.classes.map((cls) => (
              <div
                key={cls.scheduleId}
                className="flex items-center gap-3 py-1.5"
              >
                <div
                  className="w-1.5 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: cls.colorHex }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text truncate">
                    {cls.subjectName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {cls.startTime} - {cls.endTime}
                  </p>
                </div>
                <div className="shrink-0">
                  {cls.attendanceMarked ? (
                    <span
                      className={clsx(
                        "w-2.5 h-2.5 rounded-full inline-block",
                        cls.attendanceStatus === "present"
                          ? "bg-green-400"
                          : cls.attendanceStatus === "late"
                          ? "bg-yellow-400"
                          : cls.attendanceStatus === "cancelled"
                          ? "bg-slate-400"
                          : "bg-red-400"
                      )}
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full inline-block bg-white/20" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No classes today */}
      {today && today.classes.length === 0 && (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-text-muted text-sm font-bold">
            No classes today — enjoy your day off! 🎉
          </p>
        </div>
      )}

      {/* Open full app link */}
      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-text-secondary hover:text-text transition"
      >
        Open full app <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
