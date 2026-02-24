"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  date: string;
  messageRevenue: number;
  purchaseRevenue: number;
};

type RevenueChartProps = {
  data: RevenuePoint[];
};

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold">Revenue attribution</h3>
      <div className="h-[280px]">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="messageRevenue" fill="#6366F1" name="Message revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="purchaseRevenue" fill="#A5B4FC" name="Purchase events" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
