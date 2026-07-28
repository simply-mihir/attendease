"use client";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { TrendingUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import {
  LazyComposedChart as ComposedChart,
  LazyLineChart as LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "@/components/charts/LazyCharts";

interface WeakDay {
  day: string;
  attendanceRate: number;
}

interface ProjectionPoint {
  date: string;
  projectedPct: number;
}

interface ForecastData {
  subjectId: string;
  subjectName: string;
  colorHex: string;
  currentPct: number;
  projectedEndPct: number;
  minRequiredPct: number;
  willPass: boolean;
  projectionPoints: ProjectionPoint[];
  weakDays: WeakDay[];
}

interface ForecastResponse {
  forecasts: ForecastData[];
  summary: { passing: number; total: number; semesterEndDate: string };
}

export default function ForecastPage() {
  const { data, isLoading: loading } = useSWRFetch<ForecastResponse>("/analytics/forecast");

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="w-56 h-8 rounded-lg bg-white/10 animate-pulse" />
        </div>
        <div className="glass rounded-2xl p-6 h-24 animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-6 h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">Attendance Forecast</span>
        </h1>
        <p className="text-text-muted text-sm mt-1 ml-[52px]">
          Projected attendance by semester end ({data.summary.semesterEndDate})
        </p>
      </div>

      {/* Summary card */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        <div
          className={clsx(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
            data.summary.passing === data.summary.total
              ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/20"
              : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20"
          )}
        >
          {data.summary.passing === data.summary.total ? (
            <CheckCircle2 className="w-6 h-6 text-white" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <p className="text-lg font-black text-text">
            <span
              className={clsx(
                data.summary.passing === data.summary.total
                  ? "text-green-400"
                  : "text-amber-400"
              )}
            >
              {data.summary.passing}
            </span>{" "}
            of {data.summary.total} subjects on track to pass
          </p>
          <p className="text-xs text-text-muted">
            Based on your historical day-of-week attendance patterns
          </p>
        </div>
      </div>

      {/* Per-subject forecast cards */}
      {data.forecasts.map((forecast, i) => (
        <div
          key={forecast.subjectId}
          className="glass rounded-2xl p-5 space-y-4"
          style={{ animation: `fade-in 0.3s ease-out ${0.05 * i}s both` }}
        >
          {/* Subject header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-10 rounded-full"
                style={{
                  backgroundColor: forecast.colorHex,
                  boxShadow: `0 0 10px ${forecast.colorHex}30`,
                }}
              />
              <div>
                <h3 className="font-bold text-text">{forecast.subjectName}</h3>
                <p className="text-xs text-text-muted">
                  Current: {forecast.currentPct}% · Min: {forecast.minRequiredPct}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={clsx(
                  "text-2xl font-black",
                  forecast.willPass ? "text-green-400" : "text-red-400"
                )}
              >
                {forecast.projectedEndPct}%
              </p>
              <p className="text-xs text-text-muted">Projected</p>
            </div>
          </div>

          {/* Line chart */}
          {forecast.projectionPoints.length > 1 && (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={forecast.projectionPoints.map((p) => ({
                    ...p,
                    min: forecast.minRequiredPct,
                    shortDate: p.date.slice(5), // MM-DD
                  }))}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 10, fill: "#8087A2" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[
                      Math.max(0, Math.min(forecast.minRequiredPct - 15, forecast.projectedEndPct - 10)),
                      100,
                    ]}
                    tick={{ fontSize: 10, fill: "#8087A2" }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Projected"]}
                    contentStyle={{
                      backgroundColor: "rgba(24,25,38,0.95)",
                      border: "2px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#8087A2" }}
                  />
                  <ReferenceLine
                    y={forecast.minRequiredPct}
                    stroke="#ef4444"
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    label={{
                      value: `Min ${forecast.minRequiredPct}%`,
                      position: "right",
                      fill: "#ef4444",
                      fontSize: 10,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projectedPct"
                    fill={forecast.willPass ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}
                    stroke="transparent"
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedPct"
                    stroke={forecast.colorHex}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: forecast.colorHex,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak days + verdict */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {forecast.weakDays.length > 0 ? (
                forecast.weakDays.map((wd) => (
                  <span
                    key={wd.day}
                    className="px-2.5 py-1 rounded-full text-xs font-black bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {wd.day}: {wd.attendanceRate}%
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-muted">
                  No consistently weak days
                </span>
              )}
            </div>
            <div
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black",
                forecast.willPass
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              )}
            >
              {forecast.willPass ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  On track to pass
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  Projected to fail
                  {forecast.weakDays.length > 0 &&
                    ` — attend more ${forecast.weakDays[0].day}s`}
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {data.forecasts.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-text-muted">No subjects to forecast. Add subjects first!</p>
        </div>
      )}
    </div>
  );
}
