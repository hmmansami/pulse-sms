export const dynamic = 'force-dynamic';

import Link from "next/link";
import { notFound } from "next/navigation";

import { SubscriberDetail } from "@/components/subscribers/subscriber-detail";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import type { SubscriberDetailRecord } from "@/types";

function mapSubscriber(subscriber: {
  id: string;
  workspaceId: string;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  smsConsent: boolean;
  emailConsent: boolean;
  smsOptInAt: Date | null;
  emailOptInAt: Date | null;
  smsOptOutAt: Date | null;
  emailOptOutAt: Date | null;
  source: string | null;
  customAttrs: unknown;
  timezone: string | null;
  country: string | null;
  city: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  events: Array<{ id: string; type: string; properties: unknown; createdAt: Date }>;
  consentLog: Array<{ id: string; channel: string; action: string; method: string; createdAt: Date }>;
}): SubscriberDetailRecord {
  return {
    id: subscriber.id,
    workspaceId: subscriber.workspaceId,
    phone: subscriber.phone,
    email: subscriber.email,
    firstName: subscriber.firstName,
    lastName: subscriber.lastName,
    smsConsent: subscriber.smsConsent,
    emailConsent: subscriber.emailConsent,
    smsOptInAt: subscriber.smsOptInAt?.toISOString() ?? null,
    emailOptInAt: subscriber.emailOptInAt?.toISOString() ?? null,
    smsOptOutAt: subscriber.smsOptOutAt?.toISOString() ?? null,
    emailOptOutAt: subscriber.emailOptOutAt?.toISOString() ?? null,
    source: subscriber.source,
    customAttrs: typeof subscriber.customAttrs === "object" && subscriber.customAttrs !== null ? (subscriber.customAttrs as Record<string, unknown>) : {},
    timezone: subscriber.timezone,
    country: subscriber.country,
    city: subscriber.city,
    tags: subscriber.tags,
    createdAt: subscriber.createdAt.toISOString(),
    updatedAt: subscriber.updatedAt.toISOString(),
    events: subscriber.events.map((event) => ({
      id: event.id,
      type: event.type,
      properties: event.properties && typeof event.properties === "object" ? (event.properties as Record<string, unknown>) : null,
      createdAt: event.createdAt.toISOString(),
    })),
    consentLog: subscriber.consentLog.map((entry) => ({
      id: entry.id,
      channel: entry.channel as "sms" | "email",
      action: entry.action as "opt_in" | "opt_out",
      method: entry.method,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export default async function SubscriberDetailPage({ params }: { params: { id: string } }) {
  const subscriber = await db.subscriber.findUnique({
    where: { id: params.id },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      consentLog: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!subscriber) {
    notFound();
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subscriber Detail</h1>
          <p className="text-sm text-muted-foreground">Profile, tags, custom attributes, and activity timeline.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/subscribers">Back</Link>
        </Button>
      </div>

      <SubscriberDetail subscriber={mapSubscriber(subscriber)} />
    </main>
  );
}
