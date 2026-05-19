"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartDataItem } from "../types/oecd";

interface BarChartProps {
  data: ChartDataItem[];
}

export default function BarChart({ data }: BarChartProps) {
  const height = Math.max(420, data.length * 30);

  return (
    <div style={{ width: "100%", minWidth: 0, minHeight: height, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{
            top: 10,
            right: 34,
            left: 12,
            bottom: 10,
          }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(255, 255, 255, 0.08)" />
          <XAxis
            type="number"
            domain={[0, "dataMax + 10"]}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.12)" }}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={112}
            tick={{ fill: "#cbd5e1", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? value.toFixed(1) : value,
              "지수",
            ]}
            labelStyle={{ color: "#f1f5f9", fontWeight: 700 }}
            contentStyle={{
              background: "rgba(17, 24, 39, 0.96)",
              color: "#f1f5f9",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
            }}
          />
          <ReferenceLine
            x={100}
            stroke="#f87171"
            strokeDasharray="4 4"
            label={{ value: "한국 100", fill: "#f87171", fontSize: 12 }}
          />
          <Bar dataKey="value" name="K-Collusion Index" radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(1) : value
              }
              fill="#cbd5e1"
              fontSize={12}
            />
            {data.map((entry) => (
              <Cell
                key={entry.countryCode}
                fill={entry.countryCode === "KOR" ? "#8b5cf6" : "#3b82f6"}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
