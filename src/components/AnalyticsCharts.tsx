"use client";

import { useState, useEffect } from "react";
import { BarChart3, Shield, AlertTriangle, AlertOctagon } from "lucide-react";

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
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setMounted(true), 80);
    });
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
   Futuristic Bar Chart
   ─────────────────────────────────────────────── */

function ChartHeader() {
  return (
    <h3 className="font-black mb-0 flex items-center gap-2 text-[#1a1a2e] dark:text-white relative z-10">
      <div className="w-8 h-8 rounded-xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_2px_0_0_#5a189a]">
        <BarChart3 className="w-4 h-4 text-white" />
      </div>
      Subject Comparison
    </h3>
  );
}

function FuturisticBarChart({
  data,
  mounted,
}: {
  data: AnalyticsChartsProps["barData"];
  mounted: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxH = 260;

  if (data.length === 0) {
    return (
      <div className="lg:col-span-2 card-3d p-6">
        <ChartHeader />
        <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm text-center py-12 font-bold">
          No data yet
        </p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 card-3d p-6 relative overflow-hidden">
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none futuristic-scanline-bg"
        style={{ opacity: 0.02 }}
      />

      <ChartHeader />

      <div className="relative mt-6">
        <div className="flex">
          {/* Y-axis labels */}
          <div
            className="flex flex-col justify-between pr-2 text-right shrink-0"
            style={{ height: maxH }}
          >
            {[100, 75, 50, 25, 0].map((v) => (
              <span
                key={v}
                className="text-[10px] font-bold text-[#6b7280] leading-none tabular-nums"
              >
                {v}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <div className="flex-1 relative" style={{ height: maxH }}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((v) => (
              <div
                key={v}
                className="absolute w-full"
                style={{
                  top: `${100 - v}%`,
                  height: 1,
                  background:
                    "linear-gradient(to right, rgba(128,128,128,0.08), rgba(128,128,128,0.15), rgba(128,128,128,0.08))",
                }}
              />
            ))}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-evenly gap-1 sm:gap-2 px-1">
              {data.map((d, i) => {
                const isHover = hoveredIdx === i;
                const h = (d.percentage / 100) * maxH;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end max-w-[48px] min-w-[16px]"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ height: "100%", cursor: "pointer" }}
                  >
                    {/* Percentage label */}
                    <span
                      className="text-[10px] font-extrabold mb-1 tabular-nums whitespace-nowrap"
                      style={{
                        color: d.fill,
                        opacity: mounted ? 1 : 0,
                        transform: mounted
                          ? "translateY(0)"
                          : "translateY(8px)",
                        transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08 + 0.65}s`,
                        textShadow: isHover
                          ? `0 0 10px ${d.fill}90`
                          : "none",
                      }}
                    >
                      {d.percentage}%
                    </span>

                    {/* Glow layer (behind bar) */}
                    <div
                      className="absolute bottom-0 rounded-t-md"
                      style={{
                        width: "80%",
                        height: mounted ? h + 6 : 0,
                        background: d.fill,
                        opacity: isHover ? 0.2 : 0.08,
                        filter: "blur(10px)",
                        transition: `height 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s, opacity 0.3s`,
                      }}
                    />

                    {/* Main bar */}
                    <div
                      className="w-full rounded-t-md relative overflow-hidden"
                      style={{
                        height: mounted ? h : 0,
                        background: `linear-gradient(to top, ${d.fill}70, ${d.fill}CC, ${d.fill})`,
                        boxShadow: isHover
                          ? `0 0 24px ${d.fill}50, 0 0 48px ${d.fill}18, inset 0 1px 0 rgba(255,255,255,0.3)`
                          : `0 0 8px ${d.fill}20, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        transition: `height 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s, box-shadow 0.3s, transform 0.25s`,
                        transform: isHover ? "scaleX(1.1)" : "scaleX(1)",
                      }}
                    >
                      {/* Vertical shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                      {/* Bright top edge */}
                      <div
                        className="absolute top-0 inset-x-0 h-[2px] rounded-t-md"
                        style={{
                          background: `linear-gradient(to right, transparent, ${d.fill}, transparent)`,
                          boxShadow: `0 0 8px ${d.fill}`,
                        }}
                      />
                      {/* Rising scanline */}
                      <div
                        className="absolute inset-x-0 h-[1px] futuristic-bar-scan"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom axis */}
            <div
              className="absolute bottom-0 inset-x-0 h-[1px]"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(128,128,128,0.2), transparent)",
              }}
            />
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex ml-[36px]">
          <div className="flex-1 flex justify-evenly gap-1 sm:gap-2 px-1 mt-2 overflow-hidden">
            {data.map((d, i) => (
              <div
                key={i}
                className="flex-1 max-w-[48px] min-w-[16px]"
                style={{ height: data.length > 5 ? 50 : 24 }}
              >
                <span
                  className="block text-[9px] sm:text-[10px] font-bold text-[#6b7280] text-center leading-tight"
                  title={d.name}
                  style={{
                    transform:
                      data.length > 5 ? "rotate(-40deg)" : "none",
                    transformOrigin: "top center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: data.length > 5 ? 60 : 48,
                  }}
                >
                  {d.name.length > 10
                    ? d.name.slice(0, 9) + "…"
                    : d.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredIdx !== null && (
        <div
          className="absolute top-4 right-4 px-3 py-2 rounded-xl text-xs font-bold z-20 border"
          style={{
            background: "rgba(20,20,37,0.92)",
            borderColor: `${data[hoveredIdx].fill}40`,
            color: "#fff",
            boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${data[hoveredIdx].fill}20`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ color: data[hoveredIdx].fill }}>
            {data[hoveredIdx].name}
          </span>
          <span className="text-[#9ca3af] mx-1.5">·</span>
          <span className="text-white tabular-nums">
            {data[hoveredIdx].percentage}%
          </span>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Futuristic Donut Chart
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

  let cumDeg = -90;
  const segments = data.map((d) => {
    const deg = (d.value / total) * 360;
    const seg = { ...d, startDeg: cumDeg, deg };
    cumDeg += deg;
    return seg;
  });

  return (
    <div className="card-3d p-6 relative overflow-hidden">
      {/* Ambient rotating glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl futuristic-glow-pulse"
          style={{
            background: `conic-gradient(from 0deg, ${data
              .map(
                (d, i) =>
                  `${d.color}25 ${(i / data.length) * 100}%`
              )
              .join(", ")}, ${data[0]?.color}25 100%)`,
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
                id={`aGlow-${i}`}
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
                <feFlood floodColor={d.color} floodOpacity="0.4" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
            {data.map((d, i) => (
              <linearGradient
                key={`lg-${i}`}
                id={`arcGrad-${i}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={d.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={d.color} stopOpacity="1" />
              </linearGradient>
            ))}
          </defs>

          {/* Background track ring */}
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

          {/* Animated arc segments */}
          {segments.map((seg, i) => {
            const animDeg = seg.deg * progress;
            if (animDeg < 0.3) return null;
            const isHover = hoveredIdx === i;
            const oR = isHover ? outerR + 4 : outerR;
            const iR = isHover ? innerR - 2 : innerR;

            return (
              <g key={i}>
                {/* Glow behind segment */}
                <path
                  d={arcPath(cx, cy, oR + 3, iR - 3, seg.startDeg, animDeg)}
                  fill={seg.color}
                  opacity={isHover ? 0.2 : 0.08}
                  style={{ filter: "blur(6px)" }}
                />
                {/* Main segment */}
                <path
                  d={arcPath(cx, cy, oR, iR, seg.startDeg, animDeg)}
                  fill={`url(#arcGrad-${i})`}
                  opacity={isHover ? 1 : 0.82}
                  filter={isHover ? `url(#aGlow-${i})` : undefined}
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

          {/* Segment boundary dots */}
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

      {/* Hover info */}
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
