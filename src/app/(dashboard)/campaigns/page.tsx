export const dynamic = 'force-dynamic';

import Link from "next/link";

import { CampaignList } from "@/components/campaigns/campaign-list";
import { db } from "@/lib/db";
import { getDefaultWorkspaceId } from "@/lib/workspace";

export default async function CampaignsPage() {
  const workspaceId = await getDefaultWorkspaceId();

  const campaigns = await db.campaign.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      sendCount: true,
      createdAt: true,
      scheduledAt: true,
      sentAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-600">Create and track SMS + email campaigns.</p>
        </div>
        <Link href="/campaigns/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          New campaign
        </Link>
      </div>

      <CampaignList campaigns={campaigns} />
    </main>
  );
}
