"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type JourneyListItem = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused";
  updatedAt: string;
};

function statusClass(status: JourneyListItem["status"]) {
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  if (status === "paused") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<JourneyListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/journeys");
      const payload = (await response.json()) as { data?: JourneyListItem[] };
      setJourneys(payload.data ?? []);
      setLoading(false);
    };

    void run();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Journeys</h1>
            <p className="text-sm text-slate-600">Build event-driven automation flows.</p>
          </div>

          <Link
            href="/journeys/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New Journey
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Journey</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>
                    Loading journeys...
                  </td>
                </tr>
              )}

              {!loading && journeys.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>
                    No journeys yet.
                  </td>
                </tr>
              )}

              {!loading &&
                journeys.map((journey) => (
                  <tr key={journey.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{journey.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(journey.status)}`}>
                        {journey.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(journey.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/journeys/${journey.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
