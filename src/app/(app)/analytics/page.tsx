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
    fill: s.statusColor === "green" ? "#06d6a0" : s.statusColor === "yellow" ? "#ff6b35" : "#ef476f",
  }));

  const pieData = [
    { name: "Safe", value: dashboard.safeSubjects, color: "#06d6a0", subjects: dashboard.subjectsSummary.filter((s: any) => s.statusColor === "green").map((s: any) => s.name) },
    { name: "Warning", value: dashboard.warningSubjects, color: "#ff6b35", subjects: dashboard.subjectsSummary.filter((s: any) => s.statusColor === "yellow").map((s: any) => s.name) },
    { name: "Danger", value: dashboard.dangerSubjects, color: "#ef476f", subjects: dashboard.subjectsSummary.filter((s: any) => s.statusColor === "red").map((s: any) => s.name) },
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4361ee]/10">
          <BarChart3 className="h-6 w-6 text-[#4361ee]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">Your performance at a glance</p>
        </div>
      </div>

      {/* Overview cards */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={100} staggerDelay={80} animation="flipIn">
        <div className="rounded-2xl border-2 p-5 text-center transition-all duration-150 border-[#8944cd] bg-[#9b5de5]/10 shadow-[0_4px_0_0_#8944cd] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#8944cd] dark:border-[#7d32b5] dark:shadow-[0_4px_0_0_#7d32b5] dark:hover:shadow-[0_2px_0_0_#7d32b5]">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9b5de5]/20">
              <TrendingUp className="h-6 w-6 text-[#9b5de5]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#9b5de5] tracking-tight">{dashboard.overallPct}%</p>
          <p className="text-sm font-bold text-[#9b5de5] opacity-80 mt-1">Overall</p>
        </div>

        <div className="rounded-2xl border-2 p-5 text-center transition-all duration-150 border-[#05a87e] bg-[#06d6a0]/10 shadow-[0_4px_0_0_#05a87e] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#05a87e] dark:border-[#048261] dark:shadow-[0_4px_0_0_#048261] dark:hover:shadow-[0_2px_0_0_#048261]">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06d6a0]/20">
              <ShieldCheck className="h-6 w-6 text-[#06d6a0]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#06d6a0] tracking-tight">{dashboard.safeSubjects}</p>
          <p className="text-sm font-bold text-[#06d6a0] opacity-80 mt-1">Safe</p>
        </div>

        <div className="rounded-2xl border-2 p-5 text-center transition-all duration-150 border-[#d63b5f] bg-[#ef476f]/10 shadow-[0_4px_0_0_#d63b5f] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d63b5f] dark:border-[#b83151] dark:shadow-[0_4px_0_0_#b83151] dark:hover:shadow-[0_2px_0_0_#b83151]">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ef476f]/20">
              <ShieldAlert className="h-6 w-6 text-[#ef476f]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#ef476f] tracking-tight">{dashboard.dangerSubjects}</p>
          <p className="text-sm font-bold text-[#ef476f] opacity-80 mt-1">Danger</p>
        </div>

        <div className="rounded-2xl border-2 p-5 text-center transition-all duration-150 border-[#e85827] bg-[#ff6b35]/10 shadow-[0_4px_0_0_#e85827] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#e85827] dark:border-[#c5471c] dark:shadow-[0_4px_0_0_#c5471c] dark:hover:shadow-[0_2px_0_0_#c5471c]">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6b35]/20">
              <Flame className="h-6 w-6 text-[#ff6b35]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#ff6b35] tracking-tight">{dashboard.currentStreak}</p>
          <p className="text-sm font-bold text-[#ff6b35] opacity-80 mt-1">Streak</p>
        </div>
      </StaggerGrid>

      {/* Charts row — lazy loaded */}
      <div style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 200ms forwards" }}>
        <AnalyticsCharts barData={barData} pieData={pieData} />
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl border-2 p-6 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 250ms forwards" }}>
        <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-white mb-4">Attendance Heatmap — {year}</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth: "700px" }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div key={di}
                    className={clsx(
                      "w-3.5 h-3.5 rounded-md transition-all",
                      day.intensity === -1 ? "opacity-0" : "",
                      day.intensity === 0 ? "bg-gray-200 dark:bg-[#1f1f35]" :
                      day.intensity === 1 ? "bg-[#ef476f] shadow-[0_2px_0_0_#cc1a42]" :
                      day.intensity === 2 ? "bg-[#ff6b35] shadow-[0_2px_0_0_#d95220]" :
                      day.intensity === 3 ? "bg-[#00f5d4] shadow-[0_2px_0_0_#00c4a7]" :
                      day.intensity === 4 ? "bg-[#06d6a0] shadow-[0_2px_0_0_#038c67]" : "transparent"
                    )}
                    title={day.date ? `${day.date}: ${["No class","Missed","Mixed","Mostly present","Perfect"][day.intensity] || ""}` : ""}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-md bg-gray-200 dark:bg-[#1f1f35]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#ef476f]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#ff6b35]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#00f5d4]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#06d6a0]" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Per-subject details */}
      <div className="rounded-2xl border-2 p-6 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 300ms forwards" }}>
        <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-white mb-4">Subject Breakdown</h3>
        <StaggerGrid className="space-y-3" delay={350} staggerDelay={50} animation="fadeSlideLeft">
          {dashboard.subjectsSummary.map((s: any) => (
            <div key={s.id} className="rounded-2xl border-2 p-4 flex items-center gap-4 group transition-all duration-150 border-gray-200 bg-white shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_4px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]" style={{ borderLeftWidth: "4px", borderLeftColor: s.colorHex || "#FF2D78" }}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#1a1a2e] dark:text-white truncate">{s.name}</p>
                <div className="h-2 w-full rounded-full bg-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:bg-[#1f1f35] mt-2">
                  <div className={clsx("h-full rounded-full transition-all duration-500 shadow-[0_2px_0_0_rgba(0,0,0,0.2)]",
                    s.statusColor === "green" ? "bg-[#06d6a0]" : s.statusColor === "yellow" ? "bg-[#ff6b35]" : "bg-[#ef476f]"
                  )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={clsx("text-lg font-extrabold tracking-tight",
                  s.statusColor === "green" ? "text-[#06d6a0]" : s.statusColor === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]"
                )}>{s.currentPercentage}%</span>
                <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">
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
