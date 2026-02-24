import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { evaluateSegment } from "@/lib/segments";
import type { ApiResponse, SegmentRules, SubscriberRecord } from "@/types";

const segmentRulesSchema: z.ZodType<SegmentRules> = z.object({
  logic: z.enum(["and", "or"]),
  conditions: z.array(
    z.object({
      field: z.string().min(1),
      operator: z.enum(["equals", "not_equals", "contains", "gt", "lt", "gte", "lte", "in", "not_in", "exists", "not_exists"]),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    })
  ),
});

function toSubscriberRecord(subscriber: {
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
  events: Array<{
    type: string;
    createdAt: Date;
    properties: unknown;
  }>;
}): SubscriberRecord & { events: Array<{ type: string; createdAt: string; properties?: Record<string, unknown> | null }> } {
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
      type: event.type,
      createdAt: event.createdAt.toISOString(),
      properties: event.properties && typeof event.properties === "object" ? (event.properties as Record<string, unknown>) : null,
    })),
  };
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const segment = await db.segment.findUnique({ where: { id: params.id } });

    if (!segment) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Segment not found" }, { status: 404 });
    }

    const rules = segmentRulesSchema.parse(segment.rules);

    const subscribers = await db.subscriber.findMany({
      where: { workspaceId: segment.workspaceId },
      include: {
        events: {
          select: {
            type: true,
            createdAt: true,
            properties: true,
          },
        },
      },
    });

    const evaluated = evaluateSegment(
      subscribers.map((subscriber) => toSubscriberRecord(subscriber)),
      rules
    );

    await db.$transaction(async (tx) => {
      await tx.segmentMembership.deleteMany({ where: { segmentId: segment.id } });

      if (evaluated.length) {
        await tx.segmentMembership.createMany({
          data: evaluated.map((subscriber) => ({
            segmentId: segment.id,
            subscriberId: subscriber.id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.segment.update({
        where: { id: segment.id },
        data: { subscriberCount: evaluated.length },
      });
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        segmentId: segment.id,
        subscriberCount: evaluated.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to evaluate segment";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}
