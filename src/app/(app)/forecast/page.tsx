"use client";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { TrendingUp, CheckCircle2, XCircle, AlertTriangle , Sparkles } from "lucide-react";
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
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

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
    return <FuturisticLoader variant="section" title="Loading forecast" Icon={Sparkles} />;
  }

  if (!data) return null;

  return (
    <PageTransition direction="left" staggerChildren={false} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          Attendance Forecast
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
          Projected attendance by semester end ({data.summary.semesterEndDate})
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-3xl p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl flex items-center gap-4 transition-all" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div
          className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
            data.summary.passing === data.summary.total
              ? "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-500/20"
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
          <p className="text-lg font-extrabold text-gray-900 dark:text-white">
            <span
              className={clsx(
                data.summary.passing === data.summary.total
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {data.summary.passing}
            </span>{" "}
            of {data.summary.total} subjects on track to pass
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Based on your historical day-of-week attendance patterns
          </p>
        </div>
      </div>

      {/* Per-subject forecast cards */}
      <StaggerGrid className="space-y-4" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {data.forecasts.map((forecast) => (
          <div
            key={forecast.subjectId}
            className="rounded-3xl p-5 sm:p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-4 transition-all"
          >
            {/* Subject header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-10 rounded-full"
                  style={{
                    backgroundColor: forecast.colorHex,
                    boxShadow: `0 0 10px ${forecast.colorHex}40`,
                  }}
                />
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">{forecast.subjectName}</h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Current: {forecast.currentPct}% · Min: {forecast.minRequiredPct}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={clsx(
                    "text-2xl sm:text-3xl font-black",
                    forecast.willPass ? "text-teal-600 dark:text-teal-400" : "text-rose-500 dark:text-rose-400"
                  )}
                >
                  {forecast.projectedEndPct}%
                </p>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Projected</p>
              </div>
            </div>

            {/* Line chart */}
            {forecast.projectionPoints.length > 1 && (
              <div className="h-52 w-full pt-2">
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
                      stroke="rgba(150,150,150,0.15)"
                    />
                    <XAxis
                      dataKey="shortDate"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[
                        Math.max(0, Math.min(forecast.minRequiredPct - 15, forecast.projectedEndPct - 10)),
                        100,
                      ]}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Projected"]}
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.92)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <ReferenceLine
                      y={forecast.minRequiredPct}
                      stroke="#f43f5e"
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      label={{
                        value: `Min ${forecast.minRequiredPct}%`,
                        position: "right",
                        fill: "#f43f5e",
                        fontSize: 10,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedPct"
                      fill={forecast.willPass ? "rgba(13,148,136,0.12)" : "rgba(244,63,94,0.12)"}
                      stroke="transparent"
                    />
                    <Line
                      type="monotone"
                      dataKey="projectedPct"
                      stroke={forecast.colorHex}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 5,
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
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {forecast.weakDays.length > 0 ? (
                  forecast.weakDays.map((wd) => (
                    <span
                      key={wd.day}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                    >
                      {wd.day}: {wd.attendanceRate}%
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    No consistently weak days
                  </span>
                )}
              </div>
              <div
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border",
                  forecast.willPass
                    ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20"
                    : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                )}
              >
                {forecast.willPass ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    On track to pass
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
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
          <div className="rounded-3xl p-8 text-center bg-white border border-gray-200/60 dark:bg-white/[0.04] dark:border-white/[0.08]">
            <p className="text-gray-500 dark:text-gray-400">No subjects to forecast. Add subjects first!</p>
          </div>
        )}
      </StaggerGrid>
    </PageTransition>
  );
}
