"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Shield,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

/* ─── Types ─── */

interface AnalyticsChartsProps {
  barData: { name: string; percentage: number; fill: string }[];
  pieData: {
    name: string;
    value: number;
    color: string;
    subjects?: string[];
  }[];
}

/* ─── Root ─── */

export default function AnalyticsCharts({
  barData,
  pieData,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setTimeout(() => setMounted(true), 80)
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <FuturisticBarChart data={barData} mounted={mounted} />
      <FuturisticDonut data={pieData} mounted={mounted} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Horizontal Bar Chart
   ═══════════════════════════════════════════════ */

function FuturisticBarChart({
  data,
  mounted,
}: {
  data: AnalyticsChartsProps["barData"];
  mounted: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="lg:col-span-2 card-3d p-6">
        <h3 className="font-black mb-4 flex items-center gap-2 text-[#1a1a2e] dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_2px_0_0_#5a189a]">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          Subject Comparison
        </h3>
        <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm text-center py-12 font-bold">
          No data yet
        </p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 card-3d p-6 relative overflow-hidden">
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none futuristic-scanline-bg"
        style={{ opacity: 0.012 }}
      />

      <h3 className="font-black mb-5 flex items-center gap-2 text-[#1a1a2e] dark:text-white relative z-10">
        <div className="w-8 h-8 rounded-xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_2px_0_0_#5a189a]">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        Subject Comparison
      </h3>

      <div className="space-y-5 relative z-10 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
        {data.map((d, i) => {
          const isHover = hoveredIdx === i;
          return (
            <div
              key={i}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Label row */}
              <div className="flex items-center justify-between mb-2 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Status color accent bar */}
                  <div
                    className="w-1 h-4 rounded-full shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: d.fill,
                      boxShadow: isHover
                        ? `0 0 8px ${d.fill}80`
                        : "none",
                      transform: isHover
                        ? "scaleY(1.3)"
                        : "scaleY(1)",
                    }}
                  />
                  <span
                    className="text-[12px] font-bold leading-tight transition-colors duration-200"
                    style={{
                      color: isHover ? d.fill : undefined,
                    }}
                  >
                    <span
                      className={
                        isHover
                          ? ""
                          : "text-[#3a3a4a] dark:text-[#b0b0c0]"
                      }
                    >
                      {d.name}
                    </span>
                  </span>
                </div>
                <span
                  className="text-[12px] font-extrabold tabular-nums shrink-0 transition-all duration-300"
                  style={{
                    color: d.fill,
                    textShadow: isHover
                      ? `0 0 12px ${d.fill}90`
                      : "none",
                  }}
                >
                  {d.percentage}%
                </span>
              </div>

              {/* Bar track */}
              <div
                className="relative h-3 rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  background: isHover
                    ? `${d.fill}08`
                    : "rgba(128,128,128,0.06)",
                  boxShadow: `inset 0 1px 2px rgba(0,0,0,0.04)`,
                }}
              >
                {/* Percentage grid ticks inside track */}
                {[25, 50, 75].map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      left: `${tick}%`,
                      background:
                        tick === 75
                          ? "rgba(128,128,128,0.12)"
                          : "rgba(128,128,128,0.06)",
                    }}
                  />
                ))}

                {/* Fill bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-lg overflow-hidden transition-[width,box-shadow] duration-300"
                  style={{
                    width: mounted
                      ? `${d.percentage}%`
                      : "0%",
                    background: `linear-gradient(90deg, ${d.fill}40, ${d.fill}99, ${d.fill})`,
                    boxShadow: isHover
                      ? `0 0 20px ${d.fill}40, 0 2px 8px ${d.fill}25`
                      : `0 0 6px ${d.fill}10`,
                    transitionTimingFunction: `cubic-bezier(0.34,1.56,0.64,1)`,
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  {/* Glass highlight */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.18] via-white/[0.05] to-transparent" />

                  {/* Shimmer animation */}
                  <div
                    className="absolute inset-y-0 w-[30%] futuristic-bar-shimmer"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                    }}
                  />

                  {/* Bright leading edge — colored, not white */}
                  <div
                    className="absolute top-0 bottom-0 right-0 w-[3px] rounded-r-lg"
                    style={{
                      background: `linear-gradient(to bottom, ${d.fill}, ${d.fill}DD)`,
                      boxShadow: `2px 0 10px ${d.fill}70, 0 0 4px ${d.fill}50`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Status Distribution — Animated Ring Donut
   ═══════════════════════════════════════════════ */

function toXY(cx: number, cy: number, deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  spanDeg: number
) {
  const s = Math.min(spanDeg, 359.99);
  const endDeg = startDeg + s;
  const os = toXY(cx, cy, startDeg, outerR);
  const oe = toXY(cx, cy, endDeg, outerR);
  const is_ = toXY(cx, cy, endDeg, innerR);
  const ie = toXY(cx, cy, startDeg, innerR);
  const lg = s > 180 ? 1 : 0;
  return `M${os.x},${os.y} A${outerR},${outerR} 0 ${lg} 1 ${oe.x},${oe.y} L${is_.x},${is_.y} A${innerR},${innerR} 0 ${lg} 0 ${ie.x},${ie.y} Z`;
}

const ICON_MAP: Record<string, typeof Shield> = {
  Safe: Shield,
  Warning: AlertTriangle,
  Danger: AlertOctagon,
};

function FuturisticDonut({
  data,
  mounted,
}: {
  data: AnalyticsChartsProps["pieData"];
  mounted: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [progress, setProgress] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!mounted) return;
    let start = 0;
    const dur = 1500;
    function tick(ts: number) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / dur, 1);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(tick);
    }
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  if (data.length === 0 || total === 0) {
    return (
      <div className="card-3d p-6">
        <h3 className="font-black mb-4 text-[#1a1a2e] dark:text-white">
          Status Distribution
        </h3>
        <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm text-center py-12 font-bold">
          No data
        </p>
      </div>
    );
  }

  const cx = 90,
    cy = 90,
    outerR = 74,
    innerR = 50;
  const gapDeg = data.length > 1 ? 4 : 0;

  let cumDeg = -90;
  const segments = data.map((d) => {
    const rawDeg = (d.value / total) * 360;
    const deg = Math.max(rawDeg - gapDeg, 0.5);
    const startDeg = cumDeg + gapDeg / 2;
    const midDeg = startDeg + deg / 2;
    const proportion = d.value / total;
    const seg = { ...d, startDeg, deg, midDeg, proportion };
    cumDeg += rawDeg;
    return seg;
  });

  return (
    <div className="card-3d p-6 relative overflow-hidden">
      {/* Ambient rotating conic glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-3xl futuristic-glow-pulse"
          style={{
            background: `conic-gradient(from 0deg, ${data
              .map(
                (d, i) =>
                  `${d.color}18 ${(i / data.length) * 100}%`
              )
              .join(", ")}, ${data[0]?.color}18 100%)`,
          }}
        />
      </div>

      <h3 className="font-black mb-2 text-[#1a1a2e] dark:text-white relative z-10">
        Status Distribution
      </h3>

      {/* Donut SVG */}
      <div className="relative z-10 flex justify-center py-1">
        <svg viewBox="0 0 180 180" className="w-[200px] h-[200px]">
          <defs>
            {/* Scanner sweep gradient */}
            <linearGradient
              id="scannerGrad"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="white"
                stopOpacity="0"
              />
              <stop
                offset="40%"
                stopColor="white"
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor="white"
                stopOpacity="0"
              />
            </linearGradient>
            {segments.map((seg, i) => (
              <filter
                key={`f-${i}`}
                id={`segGlow-${i}`}
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="3"
                  result="blur"
                />
                <feFlood
                  floodColor={seg.color}
                  floodOpacity="0.5"
                />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={(outerR + innerR) / 2}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.04"
            strokeWidth={outerR - innerR}
          />

          {/* Outer decorative dashed ring — counter-rotates */}
          <circle
            cx={cx}
            cy={cy}
            r={outerR + 6}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.04"
            strokeWidth="0.5"
            strokeDasharray="2 7"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`-360 ${cx} ${cy}`}
              dur="35s"
              repeatCount="indefinite"
            />
          </circle>

          {/* ─── Arc segments ─── */}
          {segments.map((seg, i) => {
            const animDeg = seg.deg * progress;
            if (animDeg < 0.3) return null;
            const isHover = hoveredIdx === i;
            const oR = isHover ? outerR + 4 : outerR;
            const iR = isHover ? innerR - 3 : innerR;

            return (
              <g key={i}>
                {/* Soft glow behind */}
                <path
                  d={arcPath(
                    cx,
                    cy,
                    oR + 4,
                    iR - 4,
                    seg.startDeg,
                    animDeg
                  )}
                  fill={seg.color}
                  opacity={isHover ? 0.22 : 0.07}
                  style={{ filter: "blur(6px)" }}
                />
                {/* Main arc */}
                <path
                  d={arcPath(
                    cx,
                    cy,
                    oR,
                    iR,
                    seg.startDeg,
                    animDeg
                  )}
                  fill={seg.color}
                  opacity={isHover ? 1 : 0.82}
                  filter={
                    isHover
                      ? `url(#segGlow-${i})`
                      : undefined
                  }
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    cursor: "pointer",
                    transition: "opacity 0.25s",
                  }}
                />
                {/* Bright outer edge highlight */}
                {animDeg > 2 && (
                  <path
                    d={arcPath(
                      cx,
                      cy,
                      oR,
                      oR - 1.5,
                      seg.startDeg,
                      animDeg
                    )}
                    fill={seg.color}
                    opacity={isHover ? 0.7 : 0.35}
                    style={{ transition: "opacity 0.3s" }}
                  />
                )}
              </g>
            );
          })}

          {/* ─── Percentage labels at segment midpoints ─── */}
          {progress > 0.88 &&
            segments.map((seg, i) => {
              const pct = Math.round(seg.proportion * 100);
              if (pct < 8) return null;
              const labelR = outerR + 14;
              const midRad =
                (seg.midDeg * Math.PI) / 180;
              const lx = cx + labelR * Math.cos(midRad);
              const ly = cy + labelR * Math.sin(midRad);
              return (
                <text
                  key={`pct-${i}`}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={seg.color}
                  fontSize="8"
                  fontWeight="800"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: `opacity 0.5s ${i * 0.15 + 1.1}s`,
                    filter: `drop-shadow(0 0 3px ${seg.color}60)`,
                  }}
                >
                  {pct}%
                </text>
              );
            })}

          {/* ─── Rotating scanner sweep ─── */}
          <path
            d={arcPath(cx, cy, outerR + 1, innerR - 1, -90, 65)}
            fill="url(#scannerGrad)"
            opacity="0.1"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="4.5s"
              repeatCount="indefinite"
            />
          </path>

          {/* ─── Per-segment energy particles ─── */}
          {progress > 0.9 &&
            segments.map((seg, i) => {
              const midR = (outerR + innerR) / 2;
              const startPt = toXY(
                cx,
                cy,
                seg.startDeg,
                midR
              );
              return (
                <g key={`energy-${i}`}>
                  {/* Particle glow trail */}
                  <circle
                    cx={startPt.x}
                    cy={startPt.y}
                    r="4"
                    fill={seg.color}
                    opacity="0.15"
                    style={{
                      filter: `blur(3px)`,
                    }}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${cx} ${cy}`}
                      to={`${seg.deg} ${cx} ${cy}`}
                      dur={`${2.5 + i * 0.8}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Particle core */}
                  <circle
                    cx={startPt.x}
                    cy={startPt.y}
                    r="1.8"
                    fill={seg.color}
                    opacity="0.75"
                    style={{
                      filter: `drop-shadow(0 0 3px ${seg.color})`,
                    }}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${cx} ${cy}`}
                      to={`${seg.deg} ${cx} ${cy}`}
                      dur={`${2.5 + i * 0.8}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

          {/* ─── Inner spinning dashed ring ─── */}
          <circle
            cx={cx}
            cy={cy}
            r={innerR - 7}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.05"
            strokeWidth="0.8"
            strokeDasharray="3 5"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="22s"
              repeatCount="indefinite"
            />
          </circle>

          {/* ─── Center ─── */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[#1a1a2e] dark:fill-white"
            fontSize="24"
            fontWeight="900"
          >
            {Math.round(total * progress)}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="7"
            fontWeight="700"
            letterSpacing="1.5"
          >
            SUBJECTS
          </text>
        </svg>
      </div>

      {/* ─── Legend with proportion mini-bars ─── */}
      <div className="mt-1 space-y-3 px-1 relative z-10">
        {data.map((group, i) => {
          const Icon = ICON_MAP[group.name];
          const pct =
            total > 0
              ? Math.round((group.value / total) * 100)
              : 0;
          return (
            <div
              key={i}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted
                  ? "translateY(0)"
                  : "translateY(8px)",
                transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12 + 1}s`,
              }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 futuristic-status-dot-pulse"
                    style={{
                      backgroundColor: group.color,
                      boxShadow: `0 0 6px ${group.color}50`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                  {Icon && (
                    <Icon
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: group.color }}
                    />
                  )}
                  <span
                    className="text-[11px] font-black"
                    style={{ color: group.color }}
                  >
                    {group.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-extrabold tabular-nums"
                  style={{ color: group.color }}
                >
                  {group.value}{" "}
                  <span className="opacity-60">({pct}%)</span>
                </span>
              </div>

              {/* Mini proportion bar */}
              <div
                className="h-1 rounded-full ml-[18px]"
                style={{
                  background: "rgba(128,128,128,0.07)",
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: mounted ? `${pct}%` : "0%",
                    background: `linear-gradient(90deg, ${group.color}80, ${group.color})`,
                    boxShadow: `0 0 6px ${group.color}30`,
                    transition: `width 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12 + 1.2}s`,
                  }}
                />
              </div>

              {/* Subject names */}
              <p className="text-[#4a4a5a] dark:text-[#6b6b80] mt-1 text-[10px] leading-relaxed font-semibold ml-[18px]">
                {group.subjects && group.subjects.length > 0
                  ? group.subjects.join(", ")
                  : "None"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
