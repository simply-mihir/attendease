"use client";

import dynamic from "next/dynamic";

// Lazy-load all Recharts chart containers — only downloaded when rendered
export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  { ssr: false }
);

export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  { ssr: false }
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  { ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
  { ssr: false }
);

export const LazyRadialBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.RadialBarChart })),
  { ssr: false }
);

export const LazyComposedChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.ComposedChart })),
  { ssr: false }
);

// Re-export non-heavy sub-components normally — these are small
export {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell,
  Area,
  RadialBar,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
