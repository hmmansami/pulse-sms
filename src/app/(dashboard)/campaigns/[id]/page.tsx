export const dynamic = 'force-dynamic';

import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignResults } from "@/components/campaigns/campaign-results";
import { normalizeCampaignContent } from "@/lib/campaigns/types";
import { db } from "@/lib/db";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await db.campaign.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        select: {
          id: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          clickedAt: true,
          revenue: true,
          channel: true,
          externalId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const content = normalizeCampaignContent(campaign.content);
  const sent = campaign.messages.filter((message) => message.status === "sent" || message.status === "delivered").length;
  const delivered = campaign.messages.filter((message) => message.status === "delivered").length;
  const clicked = campaign.messages.filter((message) => message.clickedAt).length;
  const revenue = campaign.messages.reduce((sum, message) => sum + message.revenue, 0);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{campaign.name}</h1>
          <p className="text-sm text-gray-600">
            {campaign.type.toUpperCase()} • Status: <span className="font-medium">{campaign.status}</span>
          </p>
        </div>
        <Link href="/campaigns" className="text-sm font-medium text-gray-700 underline">
          Back to campaigns
        </Link>
      </div>

      <CampaignResults sent={sent} delivered={delivered} clicked={clicked} revenue={revenue} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Campaign Content</h2>
          {content.subject ? <p className="mb-2 text-sm font-medium text-gray-800">Subject: {content.subject}</p> : null}
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{content.body}</pre>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Delivery Events</h2>
          <div className="max-h-80 space-y-2 overflow-auto">
            {campaign.messages.map((message) => (
              <div key={message.id} className="rounded border p-2 text-sm">
                <p className="font-medium text-gray-800">{message.status}</p>
                <p className="text-xs text-gray-500">External ID: {message.externalId ?? "-"}</p>
                <p className="text-xs text-gray-500">Sent: {message.sentAt ? message.sentAt.toLocaleString() : "-"}</p>
              </div>
            ))}
            {campaign.messages.length === 0 ? <p className="text-sm text-gray-500">No messages logged yet.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
