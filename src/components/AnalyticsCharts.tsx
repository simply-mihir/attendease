"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Shield,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

interface AnalyticsChartsProps {
  barData: { name: string; percentage: number; fill: string }[];
  pieData: {
    name: string;
    value: number;
    color: string;
    subjects?: string[];
  }[];
}

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

/* ───────────────────────────────────────────────
   Horizontal Bar Chart — full subject names
   ─────────────────────────────────────────────── */

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
        style={{ opacity: 0.015 }}
      />

      <h3 className="font-black mb-5 flex items-center gap-2 text-[#1a1a2e] dark:text-white relative z-10">
        <div className="w-8 h-8 rounded-xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_2px_0_0_#5a189a]">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        Subject Comparison
      </h3>

      <div className="space-y-4 relative z-10 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
        {data.map((d, i) => {
          const isHover = hoveredIdx === i;
          return (
            <div
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Label row */}
              <div className="flex items-baseline justify-between mb-1.5 gap-3">
                <span
                  className="text-[11px] font-bold leading-tight transition-colors duration-200"
                  style={{
                    color: isHover ? d.fill : undefined,
                  }}
                >
                  <span
                    className={
                      isHover
                        ? ""
                        : "text-[#4a4a5a] dark:text-[#9ca3af]"
                    }
                  >
                    {d.name}
                  </span>
                </span>
                <span
                  className="text-[11px] font-extrabold tabular-nums ml-2 shrink-0"
                  style={{
                    color: d.fill,
                    textShadow: isHover
                      ? `0 0 10px ${d.fill}80`
                      : "none",
                    transition: "text-shadow 0.3s",
                  }}
                >
                  {d.percentage}%
                </span>
              </div>

              {/* Bar track */}
              <div
                className="relative h-2.5 rounded-full"
                style={{
                  background: "rgba(128,128,128,0.07)",
                }}
              >
                {/* Fill */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                  style={{
                    width: mounted ? `${d.percentage}%` : "0%",
                    background: `linear-gradient(90deg, ${d.fill}55, ${d.fill}BB, ${d.fill})`,
                    boxShadow: isHover
                      ? `0 0 16px ${d.fill}45, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : `0 0 4px ${d.fill}12`,
                    transition: `width 1s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s, box-shadow 0.3s`,
                  }}
                >
                  {/* Glass highlight */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent" />
                  {/* Travelling shimmer */}
                  <div
                    className="absolute inset-y-0 w-[35%] futuristic-bar-shimmer"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
                    }}
                  />
                </div>

                {/* Glowing tip */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full z-10"
                  style={{
                    left: mounted
                      ? `calc(${d.percentage}% - 2.5px)`
                      : "-3px",
                    background: "white",
                    boxShadow: `0 0 6px ${d.fill}, 0 0 14px ${d.fill}90`,
                    opacity: mounted ? 1 : 0,
                    transition: `left 1s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s, opacity 0.4s ${i * 0.1 + 0.5}s`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover detail chip */}
      {hoveredIdx !== null && (
        <div
          className="absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[10px] font-bold z-20 border backdrop-blur-sm"
          style={{
            background: "rgba(20,20,37,0.88)",
            borderColor: `${data[hoveredIdx].fill}40`,
            color: "#fff",
            boxShadow: `0 4px 20px rgba(0,0,0,0.25), 0 0 10px ${data[hoveredIdx].fill}15`,
          }}
        >
          <span style={{ color: data[hoveredIdx].fill }}>
            {data[hoveredIdx].name}
          </span>
          <span className="text-[#6b7280] mx-1.5">&middot;</span>
          <span className="tabular-nums">
            {data[hoveredIdx].percentage}%
          </span>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Donut Chart — animated arcs with gaps
   ─────────────────────────────────────────────── */

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

const iconMap: Record<string, typeof Shield> = {
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
    const dur = 1400;
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
    outerR = 72,
    innerR = 48;
  const gapDeg = data.length > 1 ? 3 : 0;

  let cumDeg = -90;
  const segments = data.map((d) => {
    const rawDeg = (d.value / total) * 360;
    const deg = Math.max(rawDeg - gapDeg, 0.5);
    const seg = { ...d, startDeg: cumDeg + gapDeg / 2, deg };
    cumDeg += rawDeg;
    return seg;
  });

  return (
    <div className="card-3d p-6 relative overflow-hidden">
      {/* Ambient conic glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl futuristic-glow-pulse"
          style={{
            background: `conic-gradient(from 0deg, ${data
              .map(
                (d, i) =>
                  `${d.color}20 ${(i / data.length) * 100}%`
              )
              .join(", ")}, ${data[0]?.color}20 100%)`,
          }}
        />
      </div>

      <h3 className="font-black mb-2 text-[#1a1a2e] dark:text-white relative z-10">
        Status Distribution
      </h3>

      <div className="relative z-10 flex justify-center py-2">
        <svg viewBox="0 0 180 180" className="w-44 h-44">
          <defs>
            {data.map((d, i) => (
              <filter
                key={i}
                id={`aG2-${i}`}
                x="-25%"
                y="-25%"
                width="150%"
                height="150%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="2.5"
                  result="blur"
                />
                <feFlood
                  floodColor={d.color}
                  floodOpacity="0.4"
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

          {/* Outer decorative ring */}
          <circle
            cx={cx}
            cy={cy}
            r={outerR + 5}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.04"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`-360 ${cx} ${cy}`}
              dur="30s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Arc segments */}
          {segments.map((seg, i) => {
            const animDeg = seg.deg * progress;
            if (animDeg < 0.3) return null;
            const isHover = hoveredIdx === i;
            const oR = isHover ? outerR + 4 : outerR;
            const iR = isHover ? innerR - 2 : innerR;

            return (
              <g key={i}>
                {/* Glow behind */}
                <path
                  d={arcPath(
                    cx,
                    cy,
                    oR + 3,
                    iR - 3,
                    seg.startDeg,
                    animDeg
                  )}
                  fill={seg.color}
                  opacity={isHover ? 0.2 : 0.06}
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
                    isHover ? `url(#aG2-${i})` : undefined
                  }
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    cursor: "pointer",
                    transition: "opacity 0.25s",
                  }}
                />
              </g>
            );
          })}

          {/* Inner spinning dashed ring */}
          <circle
            cx={cx}
            cy={cy}
            r={innerR - 6}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.06"
            strokeWidth="0.8"
            strokeDasharray="3 5"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="20s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Boundary dots */}
          {progress > 0.85 &&
            segments.map((seg, i) => {
              const midR = (outerR + innerR) / 2;
              const pt = toXY(cx, cy, seg.startDeg, midR);
              return (
                <circle
                  key={`dot-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="1.8"
                  fill="white"
                  className="futuristic-dot-pulse"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
              );
            })}

          {/* Center counter */}
          <text
            x={cx}
            y={cy - 3}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[#1a1a2e] dark:fill-white"
            fontSize="22"
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

      {/* Hover tooltip */}
      {hoveredIdx !== null && (
        <div
          className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg text-[10px] font-bold z-20 border"
          style={{
            background: "rgba(20,20,37,0.9)",
            borderColor: `${data[hoveredIdx].color}40`,
            color: data[hoveredIdx].color,
            boxShadow: `0 0 12px ${data[hoveredIdx].color}15`,
          }}
        >
          {data[hoveredIdx].name}: {data[hoveredIdx].value}
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 space-y-2.5 px-1 max-h-36 overflow-y-auto custom-scrollbar relative z-10">
        {data.map((group, i) => {
          const Icon = iconMap[group.name];
          return (
            <div
              key={i}
              className="text-sm"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted
                  ? "translateX(0)"
                  : "translateX(-10px)",
                transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12 + 0.9}s`,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: group.color,
                    boxShadow: `0 0 6px ${group.color}60`,
                  }}
                />
                {Icon && (
                  <Icon
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: group.color }}
                  />
                )}
                <span
                  className="font-black"
                  style={{ color: group.color }}
                >
                  {group.name}: {group.value}
                </span>
              </div>
              <p className="text-[#4a4a5a] dark:text-[#6b6b80] mt-0.5 text-xs leading-relaxed font-semibold pl-5">
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
