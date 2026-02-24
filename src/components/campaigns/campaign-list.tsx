import Link from "next/link";

import type { CampaignStatus } from "@/types";

type CampaignListItem = {
  id: string;
  name: string;
  type: string;
  status: CampaignStatus | string;
  sendCount: number;
  createdAt: Date;
  scheduledAt: Date | null;
  sentAt: Date | null;
};

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  sent: "bg-green-100 text-green-700 border-green-200",
};

function StatusBadge({ status }: { status: string }) {
  const classes = statusStyles[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

export function CampaignList({ campaigns }: { campaigns: CampaignListItem[] }) {
  if (campaigns.length === 0) {
    return <div className="rounded-lg border border-dashed p-8 text-sm text-gray-600">No campaigns yet.</div>;
  }

  return (
    <div className="grid gap-4">
      {campaigns.map((campaign) => (
        <Link
          key={campaign.id}
          href={`/campaigns/${campaign.id}`}
          className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-gray-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{campaign.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{campaign.type.toUpperCase()} campaign</p>
            </div>
            <StatusBadge status={campaign.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Sent</p>
              <p className="font-medium text-gray-900">{campaign.sendCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Scheduled</p>
              <p className="font-medium text-gray-900">
                {campaign.scheduledAt ? campaign.scheduledAt.toLocaleString() : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Last Sent</p>
              <p className="font-medium text-gray-900">{campaign.sentAt ? campaign.sentAt.toLocaleString() : "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{campaign.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
