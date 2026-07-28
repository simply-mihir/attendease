"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { BarChart3, TrendingUp, Flame, ShieldCheck, ShieldAlert } from "lucide-react";
import clsx from "clsx";

const AnalyticsCharts = dynamic(
  () => import("@/components/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-5 h-[380px] animate-pulse">
          <div className="h-6 w-48 bg-white/10 rounded-lg mb-6" />
          <div className="h-64 w-full bg-white/5 rounded-xl" />
        </div>
        <div className="glass rounded-2xl p-5 h-[380px] animate-pulse">
          <div className="h-6 w-40 bg-white/10 rounded-lg mb-6" />
          <div className="h-48 w-48 mx-auto rounded-full bg-white/5 mt-4" />
        </div>
      </div>
    ),
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
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gradient">Analytics</h1>

        {/* Overview cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2 animate-pulse" />
              <div className="h-8 w-16 mx-auto bg-white/10 rounded-lg animate-pulse mb-1" />
              <div className="h-3 w-12 mx-auto bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts row skeleton */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-2xl p-5 h-[380px] animate-pulse">
            <div className="h-6 w-48 bg-white/10 rounded-lg mb-6" />
            <div className="h-64 w-full bg-white/5 rounded-xl" />
          </div>
          <div className="glass rounded-2xl p-5 h-[380px] animate-pulse">
            <div className="h-6 w-40 bg-white/10 rounded-lg mb-6" />
            <div className="h-48 w-48 mx-auto rounded-full bg-white/5 mt-4" />
          </div>
        </div>

        {/* Heatmap skeleton */}
        <div className="glass rounded-2xl p-5 h-[200px] animate-pulse">
          <div className="h-6 w-48 bg-white/10 rounded-lg mb-6" />
          <div className="h-32 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  const barData = dashboard.subjectsSummary.map((s: any) => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + "..." : s.name,
    percentage: s.currentPercentage,
    fill: s.statusColor === "green" ? "#22c55e" : s.statusColor === "yellow" ? "#f59e0b" : "#ef4444",
  }));

  const pieData = [
    { name: "Safe", value: dashboard.safeSubjects, color: "#22c55e" },
    { name: "Warning", value: dashboard.warningSubjects, color: "#f59e0b" },
    { name: "Danger", value: dashboard.dangerSubjects, color: "#ef4444" },
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
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gradient">Analytics</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{dashboard.overallPct}%</p>
          <p className="text-xs text-gray-500">Overall</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <p className="text-3xl font-bold text-green-400">{dashboard.safeSubjects}</p>
          <p className="text-xs text-gray-500">Safe</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <p className="text-3xl font-bold text-red-400">{dashboard.dangerSubjects}</p>
          <p className="text-xs text-gray-500">In Danger</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <p className="text-3xl font-bold text-yellow-400">{dashboard.currentStreak}</p>
          <p className="text-xs text-gray-500">Streak</p>
        </div>
      </div>

      {/* Charts row — lazy loaded */}
      <AnalyticsCharts barData={barData} pieData={pieData} />

      {/* Heatmap */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-4 text-white">Attendance Heatmap — {year}</h3>
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
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-4 text-white">Subject Breakdown</h3>
        <div className="space-y-3">
          {dashboard.subjectsSummary.map((s: any) => (
            <div key={s.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
              <div className="w-2.5 h-8 rounded-full" style={{ backgroundColor: s.colorHex }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-200 truncate">{s.name}</p>
                <div className="h-1.5 bg-white/10 rounded-full mt-1">
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
        </div>
      </div>
    </div>
  );
}
