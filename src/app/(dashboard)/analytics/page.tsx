"use client";

import { useEffect, useMemo, useState } from "react";
import { CampaignTable } from "@/components/analytics/campaign-table";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { OverviewCards } from "@/components/analytics/overview-cards";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { SubscriberChart } from "@/components/analytics/subscriber-chart";

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const defaults = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }, []);

  const [range, setRange] = useState(defaults);
  const [overview, setOverview] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const query = `from=${range.from}&to=${range.to}`;
      const [overviewRes, subscribersRes, campaignsRes, revenueRes] = await Promise.all([
        fetch(`/api/analytics/overview?${query}`),
        fetch(`/api/analytics/subscribers?${query}`),
        fetch(`/api/analytics/campaigns?${query}`),
        fetch(`/api/analytics/revenue?${query}`),
      ]);

      if (!mounted) return;

      const overviewJson = await overviewRes.json();
      const subscribersJson = await subscribersRes.json();
      const campaignsJson = await campaignsRes.json();
      const revenueJson = await revenueRes.json();

      setOverview(overviewJson.data);
      setSubscribers(subscribersJson.data ?? []);
      setCampaigns(campaignsJson.data ?? []);
      setRevenue(revenueJson.data ?? []);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [range]);

  const metrics = overview
    ? [
        {
          label: "Total Subscribers",
          value: overview.totalSubscribers,
          format: "number" as const,
          trend: overview.trends.subscribers,
        },
        {
          label: "Messages Sent",
          value: overview.messagesSent,
          format: "number" as const,
          trend: overview.trends.messages,
        },
        {
          label: "Click Rate",
          value: overview.clickRate,
          format: "percent" as const,
          trend: overview.trends.clickRate,
        },
        {
          label: "Total Revenue",
          value: overview.totalRevenue,
          format: "currency" as const,
          trend: overview.trends.revenue,
        },
      ]
    : [];

  return (
    <main className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Analytics dashboard</h1>
      </header>

      <DateRangePicker from={range.from} onChange={setRange} to={range.to} />
      <OverviewCards metrics={metrics} />
      <SubscriberChart data={subscribers} />
      <div className="grid gap-6 xl:grid-cols-2">
        <CampaignTable rows={campaigns} />
        <RevenueChart data={revenue} />
      </div>
    </main>
  );
}
