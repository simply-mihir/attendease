"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import dynamic from "next/dynamic";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { BarChart3, TrendingUp, Flame, ShieldCheck, ShieldAlert } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

const AnalyticsCharts = dynamic(
  () => import("@/components/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => <FuturisticLoader variant="section" title="Loading charts..." Icon={BarChart3} />,
  }
);

const INTENSITY_COLORS = ["#1e293b", "#ef4444", "#f59e0b", "#86efac", "#22c55e"];

export default function AnalyticsPage() {
  const [year] = useState(new Date().getFullYear());
  
  const { data: dashboard, isLoading: dashLoading } = useSWRFetch<any>("/analytics/dashboard");
  const { data: heatmapData, isLoading: heatLoading } = useSWRFetch<any>(`/analytics/heatmap?year=${year}`);
  
  const heatmap = heatmapData?.data || [];
  const loading = dashLoading || heatLoading;

  if (loading || !dashboard) {
    return <FuturisticLoader variant="section" title="Crunching numbers" Icon={TrendingUp} />;
  }

  const barData = dashboard.subjectsSummary.map((s: any) => ({
    name: s.name,
    percentage: s.currentPercentage,
    fill: s.statusColor === "green" ? "#22c55e" : s.statusColor === "yellow" ? "#f59e0b" : "#ef4444",
  }));

  const pieData = [
    { name: "Safe", value: dashboard.safeSubjects, color: "#22c55e", subjects: dashboard.subjectsSummary.filter((s: any) => s.statusColor === "green").map((s: any) => s.name) },
    { name: "Warning", value: dashboard.warningSubjects, color: "#f59e0b", subjects: dashboard.subjectsSummary.filter((s: any) => s.statusColor === "yellow").map((s: any) => s.name) },
    { name: "Danger", value: dashboard.dangerSubjects, color: "#ef4444", subjects: dashboard.subjectsSummary.filter((s: any) => s.statusColor === "red").map((s: any) => s.name) },
  ].filter((d) => d.value > 0);

  // Build heatmap grid (GitHub-style)
  const heatmapMap = new Map<string, { date: string, intensity: number }>(
    heatmap.map((d: any) => [d.date, d])
  );
  const startDate = new Date(year, 0, 1);
  const startDay = startDate.getDay();
  const weeks: { date: string; intensity: number }[][] = [];
  let currentWeek: { date: string; intensity: number }[] = [];

  // Pad first week
  for (let i = 0; i < startDay; i++) currentWeek.push({ date: "", intensity: -1 });

  for (let d = new Date(startDate); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const entry = heatmapMap.get(dateStr);
    currentWeek.push({ date: dateStr, intensity: entry?.intensity || 0 });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <PageTransition direction="scale" staggerChildren={false} className="space-y-6">
      <h1 className="text-2xl font-bold text-gradient" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>Analytics</h1>

      {/* Overview cards */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={100} staggerDelay={80} animation="flipIn">
        <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
          bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-purple-500/5 hover:border-purple-300
          dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-purple-500/20 dark:hover:shadow-lg dark:hover:shadow-purple-500/5 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.overallPct}%</p>
          <p className="text-xs text-gray-400 dark:text-gray-400">Overall</p>
        </div>
        <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
          bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-purple-500/5 hover:border-purple-300
          dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-purple-500/20 dark:hover:shadow-lg dark:hover:shadow-purple-500/5 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.safeSubjects}</p>
          <p className="text-xs text-gray-400 dark:text-gray-400">Safe</p>
        </div>
        <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
          bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-purple-500/5 hover:border-purple-300
          dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-purple-500/20 dark:hover:shadow-lg dark:hover:shadow-purple-500/5 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.dangerSubjects}</p>
          <p className="text-xs text-gray-400 dark:text-gray-400">In Danger</p>
        </div>
        <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1
          bg-white border border-gray-200 shadow-sm hover:shadow-md hover:shadow-purple-500/5 hover:border-purple-300
          dark:bg-white/[0.03] dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:border-purple-500/20 dark:hover:shadow-lg dark:hover:shadow-purple-500/5 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.currentStreak}</p>
          <p className="text-xs text-gray-400 dark:text-gray-400">Streak</p>
        </div>
      </StaggerGrid>

      {/* Charts row — lazy loaded */}
      <div style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 200ms forwards" }}>
        <AnalyticsCharts barData={barData} pieData={pieData} />
      </div>

      {/* Heatmap */}
      <div className="glass rounded-2xl p-5" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 250ms forwards" }}>
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Attendance Heatmap — {year}</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-0.5" style={{ minWidth: "700px" }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div key={di}
                    className={clsx("w-3 h-3 rounded-sm", day.intensity === -1 ? "opacity-0" : "")}
                    style={{ backgroundColor: day.intensity >= 0 ? INTENSITY_COLORS[day.intensity] : "transparent" }}
                    title={day.date ? `${day.date}: ${["No class","Missed","Mixed","Mostly present","Perfect"][day.intensity] || ""}` : ""}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Less</span>
            {INTENSITY_COLORS.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Per-subject details */}
      <div className="glass rounded-2xl p-5" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 300ms forwards" }}>
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Subject Breakdown</h3>
        <StaggerGrid className="space-y-3" delay={350} staggerDelay={50} animation="fadeSlideLeft">
          {dashboard.subjectsSummary.map((s: any) => (
            <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition">
              <div className="w-2.5 h-8 rounded-full" style={{ backgroundColor: s.colorHex }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate">{s.name}</p>
                <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-1">
                  <div className={clsx("h-full rounded-full",
                    s.statusColor === "green" ? "bg-gradient-to-r from-green-500 to-emerald-400" : s.statusColor === "yellow" ? "bg-gradient-to-r from-yellow-500 to-amber-400" : "bg-gradient-to-r from-red-500 to-rose-400"
                  )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                </div>
              </div>
              <div className="text-right">
                <span className={clsx("text-sm font-bold",
                  s.statusColor === "green" ? "text-green-400" : s.statusColor === "yellow" ? "text-yellow-400" : "text-red-400"
                )}>{s.currentPercentage}%</span>
                <p className="text-xs text-gray-500">
                  {s.statusColor === "red" ? `Need ${s.mustAttendCount}` : `Skip ${s.canSkipCount}`}
                </p>
              </div>
            </div>
          ))}
        </StaggerGrid>
      </div>
    </PageTransition>
  );
}
