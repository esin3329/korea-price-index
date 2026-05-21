"use client";

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartDataItem } from '../types/oecd';

interface BarChartProps {
  data: ChartDataItem[];
}

export default function BarChart({ data }: BarChartProps) {
  return (
    <div style={{ width: '100%', height: '400px', margin: '20px 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={80} 
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ value: 'K-Collusion Index', angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip 
            formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : String(value ?? ''), 'Index']}
            labelStyle={{ color: '#333' }}
          />
          <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" label="Korea (100)" />
          <Bar dataKey="value" name="K-Collusion Index">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.name === '대한민국' ? '#ff7300' : '#8884d8'} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
