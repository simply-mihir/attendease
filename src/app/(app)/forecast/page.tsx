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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7b2cbf]/10">
          <TrendingUp className="h-6 w-6 text-[#7b2cbf]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">Attendance Forecast</h1>
          <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">
            Projected attendance by semester end ({data.summary.semesterEndDate})
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div
        className={clsx(
          "rounded-2xl border-2 p-5 flex items-center gap-4 transition-all duration-150 mb-6",
          data.summary.passing === data.summary.total
            ? "border-[#05a87e] bg-[#06d6a0]/10 shadow-[0_4px_0_0_#05a87e] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#05a87e]"
            : "border-[#e85827] bg-[#ff6b35]/10 shadow-[0_4px_0_0_#e85827] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#e85827]"
        )}
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
      >
        <div
          className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2",
            data.summary.passing === data.summary.total
              ? "bg-[#06d6a0]/20 text-[#06d6a0] border-transparent"
              : "bg-[#ff6b35]/20 text-[#ff6b35] border-transparent"
          )}
        >
          {data.summary.passing === data.summary.total ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>
        <div>
          <p className="text-lg font-extrabold text-[#1a1a2e] dark:text-white">
            <span
              className={clsx(
                data.summary.passing === data.summary.total
                  ? "text-[#06d6a0]"
                  : "text-[#ff6b35]"
              )}
            >
              {data.summary.passing}
            </span>{" "}
            of {data.summary.total} subjects on track to pass
          </p>
          <p className={clsx("text-xs font-bold mt-0.5 opacity-80", data.summary.passing === data.summary.total ? "text-[#06d6a0]" : "text-[#ff6b35]")}>
            Based on your historical day-of-week attendance patterns
          </p>
        </div>
      </div>

      {/* Per-subject forecast cards */}
      <StaggerGrid className="space-y-4" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {data.forecasts.map((forecast) => (
          <div
            key={forecast.subjectId}
            className="rounded-2xl border-2 p-5 sm:p-6 space-y-4 transition-all duration-150 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]"
          >
            {/* Subject header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-12 rounded-full shadow-sm"
                  style={{
                    backgroundColor: forecast.colorHex || "#FF2D78",
                  }}
                />
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#1a1a2e] dark:text-white">{forecast.subjectName}</h3>
                  <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">
                    Current: {forecast.currentPct}% · Min: {forecast.minRequiredPct}%
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={clsx(
                    "text-2xl sm:text-3xl font-extrabold tracking-tight",
                    forecast.willPass ? "text-[#06d6a0]" : "text-[#ef476f]"
                  )}
                >
                  {forecast.projectedEndPct}%
                </p>
                <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">Projected</p>
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
                        border: "2px solid #2a2a3d",
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 6px 0 0 rgba(0, 0, 0, 0.3)",
                      }}
                      itemStyle={{ color: "#fff", fontWeight: "bold" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <ReferenceLine
                      y={forecast.minRequiredPct}
                      stroke="#ef476f"
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      label={{
                        value: `Min ${forecast.minRequiredPct}%`,
                        position: "right",
                        fill: "#ef476f",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedPct"
                      fill={forecast.willPass ? "rgba(6,214,160,0.15)" : "rgba(239,71,111,0.15)"}
                      stroke="transparent"
                    />
                    <Line
                      type="monotone"
                      dataKey="projectedPct"
                      stroke={forecast.colorHex || "#FF2D78"}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: forecast.colorHex || "#FF2D78",
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
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-[#ef476f]/10 text-[#ef476f] border-2 border-[#d63b5f] shadow-[0_2px_0_0_#d63b5f]"
                    >
                      {wd.day}: {wd.attendanceRate}%
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">
                    No consistently weak days
                  </span>
                )}
              </div>
              <div
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border-2",
                  forecast.willPass
                    ? "bg-[#06d6a0]/10 text-[#06d6a0] border-[#05a87e] shadow-[0_2px_0_0_#05a87e]"
                    : "bg-[#ef476f]/10 text-[#ef476f] border-[#d63b5f] shadow-[0_2px_0_0_#d63b5f]"
                )}
              >
                {forecast.willPass ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    On track to pass
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
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
          <div className="rounded-2xl border-2 p-8 text-center border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]">
            <p className="text-[#9ca3af] dark:text-[#6b6b80] font-bold">No subjects to forecast. Add subjects first!</p>
          </div>
        )}
      </StaggerGrid>
    </PageTransition>
  );
}
