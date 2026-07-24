"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { BarChart3, TrendingUp, Flame } from "lucide-react";
import clsx from "clsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const INTENSITY_COLORS = ["#1e293b", "#ef4444", "#f59e0b", "#86efac", "#22c55e"];

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    apiFetch("/analytics/dashboard").then(setDashboard).catch(console.error);
    apiFetch(`/analytics/heatmap?year=${year}`).then((d) => setHeatmap(d.data)).catch(console.error);
  }, [year]);

  if (!dashboard) return <div className="text-center py-16 text-text-muted">Loading analytics...</div>;

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
  const heatmapMap = new Map(heatmap.map((d) => [d.date, d]));
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
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-3xl font-bold">{dashboard.overallPct}%</p>
          <p className="text-xs text-text-muted">Overall</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-success" />
          <p className="text-3xl font-bold text-success">{dashboard.safeSubjects}</p>
          <p className="text-xs text-text-muted">Safe</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-danger" />
          <p className="text-3xl font-bold text-danger">{dashboard.dangerSubjects}</p>
          <p className="text-xs text-text-muted">In Danger</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <Flame className="w-6 h-6 mx-auto mb-2 text-warning" />
          <p className="text-3xl font-bold text-warning">{dashboard.currentStreak}</p>
          <p className="text-xs text-text-muted">Streak</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Subject Comparison</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {barData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">No data yet</p>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">No data</p>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4">Attendance Heatmap — {year}</h3>
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
          <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
            <span>Less</span>
            {INTENSITY_COLORS.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Per-subject details */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4">Subject Breakdown</h3>
        <div className="space-y-3">
          {dashboard.subjectsSummary.map((s: any) => (
            <div key={s.id} className="flex items-center gap-4 p-3 bg-surface-2 rounded-lg">
              <div className="w-2.5 h-8 rounded-full" style={{ backgroundColor: s.colorHex }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <div className="h-1.5 bg-surface-3 rounded-full mt-1">
                  <div className={clsx("h-full rounded-full",
                    s.statusColor === "green" ? "bg-success" : s.statusColor === "yellow" ? "bg-warning" : "bg-danger"
                  )} style={{ width: `${Math.min(100, s.currentPercentage)}%` }} />
                </div>
              </div>
              <div className="text-right">
                <span className={clsx("text-sm font-bold",
                  s.statusColor === "green" ? "text-success" : s.statusColor === "yellow" ? "text-warning" : "text-danger"
                )}>{s.currentPercentage}%</span>
                <p className="text-xs text-text-muted">
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
