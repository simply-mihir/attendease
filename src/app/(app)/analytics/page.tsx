"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import dynamic from "next/dynamic";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { Skeleton } from "@/components/Skeleton";
import { BarChart3, TrendingUp, Flame, ShieldCheck, ShieldAlert, AlertTriangle, BookOpen } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import clsx from "clsx";
import { getLocalDateStr } from "@/lib/local-date";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

const AnalyticsCharts = dynamic(
  () => import("@/components/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="card-3d p-6 h-[300px] flex items-center justify-center">
        <FieldLoader size="lg" />
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

  if (loading && !dashboard) {
    // We'll fall through and show skeletons
  }

  const barData = (dashboard?.subjectsSummary || dashboard?.subjects || []).map((s: any) => ({
    name: s.name,
    percentage: s.currentPercentage,
    fill: s.statusColor === "green" ? "#06d6a0" : s.statusColor === "yellow" ? "#ff6b35" : "#ef476f",
  }));

  const pieData = dashboard ? [
    { name: "Safe", value: dashboard.safeSubjects, color: "#06d6a0", subjects: (dashboard.subjectsSummary || dashboard.subjects || []).filter((s: any) => s.statusColor === "green").map((s: any) => s.name) },
    { name: "Warning", value: dashboard.warningSubjects, color: "#ff6b35", subjects: (dashboard.subjectsSummary || dashboard.subjects || []).filter((s: any) => s.statusColor === "yellow").map((s: any) => s.name) },
    { name: "Danger", value: dashboard.dangerSubjects, color: "#ef476f", subjects: (dashboard.subjectsSummary || dashboard.subjects || []).filter((s: any) => s.statusColor === "red").map((s: any) => s.name) },
  ].filter((d) => d.value > 0) : [];

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
    const dateStr = getLocalDateStr(d);
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

      {loading || !dashboard ? (
        <div className="flex justify-center py-20">
          <FuturisticLoader title="Loading Analytics..." variant="section" />
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={100} staggerDelay={80} animation="fadeSlideUp">
            {/* Overall (Teal) */}
            <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
              bg-[#06d6a0]/[0.06] border-2 border-[#06d6a0]/40 shadow-[0_6px_0_0_#06d6a0] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#06d6a0]
              dark:bg-[#06d6a0]/[0.08] dark:border-[#06d6a0]/40 dark:shadow-[0_6px_0_0_#049e77] dark:hover:shadow-[0_4px_0_0_#049e77]">
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-[#06d6a0] uppercase tracking-wider">Overall</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06d6a0]/20 text-[#06d6a0] border border-[#06d6a0]/30 shadow-sm">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#1a1a2e] dark:text-white tracking-tight mt-1">
                  <AnimatedCounter value={dashboard.overallPct ?? 0} suffix="%" />
                </p>
              </div>
            </div>

            {/* Subjects (Royal Blue) */}
            <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
              bg-[#4361ee]/[0.06] border-2 border-[#4361ee]/40 shadow-[0_6px_0_0_#4361ee] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#4361ee]
              dark:bg-[#4361ee]/[0.08] dark:border-[#4361ee]/40 dark:shadow-[0_6px_0_0_#3451cc] dark:hover:shadow-[0_4px_0_0_#3451cc]">
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-[#4361ee] uppercase tracking-wider">Subjects</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4361ee]/20 text-[#4361ee] border border-[#4361ee]/30 shadow-sm">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#1a1a2e] dark:text-white tracking-tight mt-1">
                  <AnimatedCounter value={dashboard.stats?.totalSubjects ?? dashboard.totalSubjects ?? dashboard.subjectsSummary?.length ?? 0} />
                </p>
              </div>
            </div>

            {/* Streak (Orange) */}
            <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
              bg-[#ff6b35]/[0.06] border-2 border-[#ff6b35]/40 shadow-[0_6px_0_0_#ff6b35] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#ff6b35]
              dark:bg-[#ff6b35]/[0.08] dark:border-[#ff6b35]/40 dark:shadow-[0_6px_0_0_#cc5529] dark:hover:shadow-[0_4px_0_0_#cc5529]">
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-[#ff6b35] uppercase tracking-wider">Streak</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35] group-hover:scale-110 transition-transform">
                    <Flame 
                      className="h-5 w-5 drop-shadow-[0_0_6px_rgba(255,107,53,0.5)]" 
                      fill={(dashboard.currentStreak ?? 0) > 0 ? "#ff6b35" : "none"}
                      style={(dashboard.currentStreak ?? 0) > 0 ? { animation: "streakFlicker 1.5s ease-in-out infinite" } : undefined} 
                    />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1 h-9">
                  <>
                    <p className="text-3xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">
                      <AnimatedCounter value={dashboard.currentStreak ?? 0} />
                    </p>
                    {(dashboard.currentStreak ?? 0) > 0 && (
                      <div className="flex items-end -mb-0.5">
                        <Flame className="h-7 w-7 text-[#ff6b35] drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]" fill="#ff6b35" style={{ animation: "streakFlicker 1.5s ease-in-out infinite" }} />
                      </div>
                    )}
                  </>
                </div>
              </div>
            </div>

            {/* In Danger (Coral) */}
            <div className="group relative rounded-2xl overflow-hidden p-5 transition-all duration-150
              bg-[#ef476f]/[0.06] border-2 border-[#ef476f]/40 shadow-[0_6px_0_0_#ef476f] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#ef476f]
              dark:bg-[#ef476f]/[0.08] dark:border-[#ef476f]/40 dark:shadow-[0_6px_0_0_#c43559] dark:hover:shadow-[0_4px_0_0_#c43559]">
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-[#ef476f] uppercase tracking-wider">In Danger</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-[#ef476f]/20 text-[#ef476f] border-[#ef476f]/30">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tight mt-1 text-[#ef476f]">
                  <AnimatedCounter value={dashboard.stats?.dangerCount ?? dashboard.dangerSubjects?.length ?? dashboard.dangerSubjects ?? 0} />
                </p>
              </div>
            </div>
          </StaggerGrid>

          {/* Charts row — lazy loaded */}
          <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 200ms forwards" }}>
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
            {(dashboard.subjectsSummary || dashboard.subjects || []).map((s: any) => (
              <div key={s.id} className="rounded-2xl border-2 p-4 flex items-center gap-4 group transition-all duration-150 border-gray-200 bg-white shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_4px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]" style={{ borderLeftWidth: "4px", borderLeftColor: s.colorHex || "#FF2D78" }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1a1a2e] dark:text-white break-words">{s.name}</p>
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
        </>
      )}
    </PageTransition>
  );
}
