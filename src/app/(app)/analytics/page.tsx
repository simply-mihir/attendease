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
      <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        Analytics
      </h1>

      {/* Overview cards */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={100} staggerDelay={80} animation="flipIn">
        <div className="card-3d p-5 text-center transition-all hover:-translate-y-1">
          <div className="w-10 h-10 rounded-2xl bg-[#7b2cbf]/15 text-[#7b2cbf] dark:text-[#c77dff] border-2 border-[#7b2cbf]/30 flex items-center justify-center mx-auto mb-2.5 shadow-[0_2px_0_0_#7b2cbf]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-text tracking-tight">{dashboard.overallPct}%</p>
          <p className="text-xs font-bold text-text-muted mt-0.5">Overall Attendance</p>
        </div>

        <div className="card-3d p-5 text-center transition-all hover:-translate-y-1 border-[#06d6a0]/40 shadow-[0_6px_0_0_#06d6a0]">
          <div className="w-10 h-10 rounded-2xl bg-[#06d6a0]/15 text-[#06d6a0] border-2 border-[#06d6a0]/40 flex items-center justify-center mx-auto mb-2.5 shadow-[0_2px_0_0_#06d6a0]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-[#06d6a0] tracking-tight">{dashboard.safeSubjects}</p>
          <p className="text-xs font-bold text-[#06d6a0] mt-0.5">Safe Subjects</p>
        </div>

        <div className="card-3d p-5 text-center transition-all hover:-translate-y-1 border-[#ef476f]/40 shadow-[0_6px_0_0_#ef476f]">
          <div className="w-10 h-10 rounded-2xl bg-[#ef476f]/15 text-[#ef476f] border-2 border-[#ef476f]/40 flex items-center justify-center mx-auto mb-2.5 shadow-[0_2px_0_0_#ef476f]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-[#ef476f] tracking-tight">{dashboard.dangerSubjects}</p>
          <p className="text-xs font-bold text-[#ef476f] mt-0.5">In Danger</p>
        </div>

        <div className="card-3d p-5 text-center transition-all hover:-translate-y-1 border-[#ff6b35]/40 shadow-[0_6px_0_0_#ff6b35]">
          <div className="w-10 h-10 rounded-2xl bg-[#ff6b35]/15 text-[#ff6b35] border-2 border-[#ff6b35]/40 flex items-center justify-center mx-auto mb-2.5 shadow-[0_2px_0_0_#ff6b35]">
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-[#ff6b35] tracking-tight">{dashboard.currentStreak}</p>
          <p className="text-xs font-bold text-[#ff6b35] mt-0.5">Day Streak</p>
        </div>
      </StaggerGrid>

      {/* Charts row — lazy loaded */}
      <div style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 200ms forwards" }}>
        <AnalyticsCharts barData={barData} pieData={pieData} />
      </div>

      {/* Heatmap */}
      <div className="card-3d p-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 250ms forwards" }}>
        <h3 className="font-black mb-4 text-base text-text">Attendance Heatmap — {year}</h3>
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
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-text-muted">
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
      <div className="card-3d p-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 300ms forwards" }}>
        <h3 className="font-black mb-4 text-base text-text">Subject Breakdown</h3>
        <StaggerGrid className="space-y-3" delay={350} staggerDelay={50} animation="fadeSlideLeft">
          {dashboard.subjectsSummary.map((s: any) => (
            <div key={s.id} className="flex items-center gap-4 p-4 card-3d transition">
              <div className="w-2.5 h-8 rounded-full shadow-sm" style={{ backgroundColor: s.colorHex || "#FF2D78" }} />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-text truncate">{s.name}</p>
                <div className="h-2.5 bg-gray-200 dark:bg-[#1f1f35] rounded-full mt-1.5 overflow-hidden">
                  <div className={clsx("h-full rounded-full transition-all duration-500",
                    s.statusColor === "green" ? "bg-[#06d6a0]" : s.statusColor === "yellow" ? "bg-[#ff6b35]" : "bg-[#ef476f]"
                  )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                </div>
              </div>
              <div className="text-right">
                <span className={clsx("text-sm font-black",
                  s.statusColor === "green" ? "text-[#06d6a0]" : s.statusColor === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]"
                )}>{s.currentPercentage}%</span>
                <p className="text-xs font-bold text-text-muted mt-0.5">
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
