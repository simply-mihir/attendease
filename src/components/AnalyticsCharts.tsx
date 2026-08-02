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

const CustomXAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#6b7280" fontSize={11} transform="rotate(-35)">
        {payload.value}
      </text>
    </g>
  );
};

export default function AnalyticsCharts({ barData, pieData }: AnalyticsChartsProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Bar chart */}
      <div className="lg:col-span-2 card-3d p-6">
        <h3 className="font-black mb-4 flex items-center gap-2 text-[#1a1a2e] dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_2px_0_0_#5a189a]">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          Subject Comparison
        </h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 160, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Attendance"]}
                contentStyle={{ backgroundColor: "#141425", border: "2px solid #2a2a3d", borderRadius: "12px", color: "#fff" }}
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
          <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm text-center py-12 font-bold">No data yet</p>
        )}
      </div>

      {/* Pie chart */}
      <div className="card-3d p-6">
        <h3 className="font-black mb-4 text-[#1a1a2e] dark:text-white">Status Distribution</h3>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#141425", border: "2px solid #2a2a3d", borderRadius: "12px", color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3 px-2 max-h-40 overflow-y-auto custom-scrollbar">
              {pieData.map((group, i) => (
                <div key={i} className="text-sm">
                  <span className="font-black" style={{ color: group.color }}>{group.name}:</span>
                  <p className="text-[#4a4a5a] dark:text-[#6b6b80] mt-0.5 text-xs leading-relaxed font-semibold">
                    {group.subjects && group.subjects.length > 0 ? group.subjects.join(", ") : "None"}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm text-center py-12 font-bold">No data</p>
        )}
      </div>
    </div>
  );
}
