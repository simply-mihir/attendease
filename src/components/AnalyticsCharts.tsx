"use client";

import {
  LazyBarChart as BarChart,
  LazyPieChart as PieChart,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "@/components/charts/LazyCharts";
import { BarChart3 } from "lucide-react";

interface AnalyticsChartsProps {
  barData: { name: string; percentage: number; fill: string }[];
  pieData: { name: string; value: number; color: string; subjects?: string[] }[];
}

export default function AnalyticsCharts({ barData, pieData }: AnalyticsChartsProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Bar chart */}
      <div className="lg:col-span-2 rounded-2xl p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/20">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          Subject Comparison
        </h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 80, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} angle={-35} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Attendance"]}
                contentStyle={{ backgroundColor: "var(--card-bg, #111827)", border: "1px solid rgba(150,150,150,0.2)", borderRadius: "12px", color: "#fff" }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#9ca3af" }}
                cursor={{ fill: "rgba(150,150,150,0.08)" }}
              />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                {barData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No data yet</p>
        )}
      </div>

      {/* Pie chart */}
      <div className="rounded-2xl p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all">
        <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Status Distribution</h3>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card-bg, #111827)", border: "1px solid rgba(150,150,150,0.2)", borderRadius: "12px", color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3 px-2 max-h-40 overflow-y-auto custom-scrollbar">
              {pieData.map((group, i) => (
                <div key={i} className="text-sm">
                  <span className="font-bold" style={{ color: group.color }}>{group.name}:</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs leading-relaxed font-medium">
                    {group.subjects && group.subjects.length > 0 ? group.subjects.join(", ") : "None"}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No data</p>
        )}
      </div>
    </div>
  );
}
