"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SubscriberPoint = {
  date: string;
  value: number;
};

type SubscriberChartProps = {
  data: SubscriberPoint[];
};

export function SubscriberChart({ data }: SubscriberChartProps) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold">Subscriber growth</h3>
      <div className="h-[280px]">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line dataKey="value" dot={false} stroke="#6366F1" strokeWidth={2.5} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
