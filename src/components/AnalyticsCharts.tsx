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
  pieData: { name: string; value: number; color: string }[];
}

export default function AnalyticsCharts({ barData, pieData }: AnalyticsChartsProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Bar chart */}
      <div className="lg:col-span-2 glass rounded-2xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          Subject Comparison
        </h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} angle={-35} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Attendance"]}
                contentStyle={{ backgroundColor: "rgba(15,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#9ca3af" }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {barData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm text-center py-12">No data yet</p>
        )}
      </div>

      {/* Pie chart */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-4 text-white">Status Distribution</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(15,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#9ca3af" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm text-center py-12">No data</p>
        )}
      </div>
    </div>
  );
}
