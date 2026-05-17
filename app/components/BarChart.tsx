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
          <CartesianGrid horizontal={false} stroke="#e5e7eb" />
          <XAxis
            type="number"
            domain={[0, "dataMax + 10"]}
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={112}
            tick={{ fill: "#334155", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? value.toFixed(1) : value,
              "지수",
            ]}
            labelStyle={{ color: "#111827", fontWeight: 700 }}
            contentStyle={{
              border: "1px solid #dbe3ef",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
            }}
          />
          <ReferenceLine
            x={100}
            stroke="#dc2626"
            strokeDasharray="4 4"
            label={{ value: "한국 100", fill: "#b91c1c", fontSize: 12 }}
          />
          <Bar dataKey="value" name="K-Collusion Index" radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(1) : value
              }
              fill="#475569"
              fontSize={12}
            />
            {data.map((entry) => (
              <Cell
                key={entry.countryCode}
                fill={
                  entry.countryCode === "KOR"
                    ? "#ea580c"
                    : entry.isSampleBacked
                      ? "#d97706"
                      : "#2563eb"
                }
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
