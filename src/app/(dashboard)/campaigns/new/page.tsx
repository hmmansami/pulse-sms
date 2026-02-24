export const dynamic = 'force-dynamic';

import Link from "next/link";

import { CampaignCreator } from "@/components/campaigns/campaign-creator";
import { db } from "@/lib/db";
import { getDefaultWorkspaceId } from "@/lib/workspace";

export default async function NewCampaignPage() {
  const workspaceId = await getDefaultWorkspaceId();

  const segments = await db.segment.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subscriberCount: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">New Campaign</h1>
          <p className="text-sm text-gray-600">Choose channel, build content, pick audience, and schedule send.</p>
        </div>
        <Link href="/campaigns" className="text-sm font-medium text-gray-700 underline">
          Back to campaigns
        </Link>
      </div>

      <CampaignCreator segments={segments} />
    </main>
  );
}
