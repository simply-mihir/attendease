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
  const dangerSubjects = dashboard?.subjectsSummary?.filter(
    (s: any) => s.statusColor === "red"
  ) || [];

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto p-4 bg-[#fafafa] dark:bg-[#0a0e1a] min-h-screen">
      {/* Overall percentage */}
      {dashboard && (
        <div className="card-3d p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "w-11 h-11 rounded-2xl flex items-center justify-center border-2 shadow-[0_3px_0_0_rgba(0,0,0,0.2)]",
                dashboard.overallPct >= 75
                  ? "bg-[#06d6a0] border-[#05a87e] text-white shadow-[#05a87e]"
                  : "bg-[#ef476f] border-[#c43559] text-white shadow-[#c43559]"
              )}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#1a1a2e] dark:text-white">
                {dashboard.overallPct}%
              </p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] font-bold">
                Overall Attendance
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="btn-3d-secondary px-3 py-2 text-xs flex items-center gap-1 cursor-pointer">
            Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Next Class Quick Mark */}
      {nextClass && (
        <div className="card-3d p-4 border-[#FF2D78]/30 bg-[#FF2D78]/5 dark:border-[#b81e56]/30 shadow-[0_4px_0_0_#cc1a5e/20] dark:shadow-[0_4px_0_0_#b81e56/20]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-[#1a1a2e] dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF2D78]" /> Next Class
            </h3>
            <span className="text-xs font-bold text-[#FF2D78] bg-[#FF2D78]/10 px-2.5 py-1 rounded-xl">
              {getCountdown(nextClass.startTime)}
            </span>
          </div>

          <div className="flex gap-3 mb-4">
            <div
              className="w-1.5 rounded-full"
              style={{ backgroundColor: nextClass.colorHex }}
            />
            <div>
              <p className="font-black text-[#1a1a2e] dark:text-white truncate max-w-[200px]">
                {nextClass.subjectName}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-1 font-bold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {nextClass.startTime}
                </span>
                {nextClass.room && (
                  <span className="flex items-center gap-1 truncate max-w-[100px]">
                    <MapPin className="w-3.5 h-3.5" />
                    {nextClass.room}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!!marking}
              onClick={() =>
                quickMark(nextClass.subjectId, nextClass.scheduleId, "present")
              }
              className="btn-3d-success py-2 text-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Present
            </button>
            <button
              disabled={!!marking}
              onClick={() =>
                quickMark(nextClass.subjectId, nextClass.scheduleId, "absent")
              }
              className="btn-3d-danger py-2 text-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Absent
            </button>
          </div>
        </div>
      )}

      {/* Action Plan (Danger subjects) */}
      {dangerSubjects.length > 0 && (
        <div className="card-3d p-4 border-[#ef476f]/30 bg-[#ef476f]/5 dark:border-[#c43559]/30 shadow-[0_4px_0_0_#c43559/20]">
          <h3 className="font-black text-[#1a1a2e] dark:text-white flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#ef476f]" /> Danger Zone
          </h3>
          <div className="space-y-2">
            {dangerSubjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white/50 dark:bg-black/20 border-2 border-[#ef476f]/10"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.colorHex }}
                  />
                  <p className="text-sm font-bold text-[#1a1a2e] dark:text-white truncate">
                    {s.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-[#ef476f]">
                    {s.currentPercentage}%
                  </span>
                  <span className="text-[10px] font-black uppercase bg-[#ef476f] text-white px-2 py-0.5 rounded-lg">
                    +{s.mustAttendCount} classes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule Overview */}
      {today && today.classes.length > 0 && (
        <div className="card-3d p-4">
          <h3 className="font-black text-[#1a1a2e] dark:text-white mb-3">Today</h3>
          <div className="space-y-2">
            {today.classes.map((c) => (
              <div
                key={c.scheduleId}
                className={clsx(
                  "flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1f1f35]",
                  c.attendanceMarked
                    ? "border-transparent bg-gray-50 dark:bg-white/5 opacity-70"
                    : "border-gray-200 dark:border-[#2a2a3d] bg-white dark:bg-[#141425]"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-1.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: c.colorHex }}
                  />
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        "text-sm font-black truncate",
                        c.attendanceMarked
                          ? "line-through text-[#9ca3af] dark:text-[#6b6b80]"
                          : "text-[#1a1a2e] dark:text-white"
                      )}
                    >
                      {c.subjectName}
                    </p>
                    <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-0.5 font-bold">
                      {c.startTime}
                    </p>
                  </div>
                </div>

                {c.attendanceMarked ? (
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2",
                      c.attendanceStatus === "present"
                        ? "bg-[#06d6a0]/10 text-[#06d6a0] border-[#06d6a0]/30"
                        : c.attendanceStatus === "absent"
                        ? "bg-[#ef476f]/10 text-[#ef476f] border-[#ef476f]/30"
                        : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-[#2a2a3d] dark:border-[#3a3a4d]"
                    )}
                  >
                    {c.attendanceStatus === "present" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : c.attendanceStatus === "absent" ? (
                      <XCircle className="w-4 h-4" />
                    ) : c.attendanceStatus === "cancelled" ? (
                      <Ban className="w-4 h-4" />
                    ) : (
                      <Timer className="w-4 h-4" />
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-black px-2 py-1 rounded-xl bg-gray-100 dark:bg-[#2a2a3d] text-[#9ca3af] dark:text-[#6b6b80]">
                    Pending
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {today && today.classes.length === 0 && (
        <div className="card-3d p-6 text-center border-dashed">
          <p className="text-sm font-black text-[#9ca3af] dark:text-[#6b6b80]">No classes today! 🎉</p>
        </div>
      )}

      {/* Open full app link */}
      <Link
        href="/dashboard"
        className="btn-3d-secondary w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        Open full app <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
