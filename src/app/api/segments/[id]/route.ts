import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { evaluateSegment } from "@/lib/segments";
import type { ApiResponse, SegmentRecord, SegmentRules, SubscriberDetailRecord, SubscriberRecord } from "@/types";

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

const updateSegmentSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    rules: segmentRulesSchema.optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

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

function toSegmentRecord(segment: {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  rules: unknown;
  subscriberCount: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SegmentRecord {
  return {
    id: segment.id,
    workspaceId: segment.workspaceId,
    name: segment.name,
    description: segment.description,
    rules: segmentRulesSchema.parse(segment.rules),
    subscriberCount: segment.subscriberCount,
    isDefault: segment.isDefault,
    createdAt: segment.createdAt.toISOString(),
    updatedAt: segment.updatedAt.toISOString(),
  };
}

async function evaluateAndPersistSegmentMembers(segmentId: string, workspaceId: string, rules: SegmentRules): Promise<number> {
  const subscribers = await db.subscriber.findMany({
    where: { workspaceId },
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
    await tx.segmentMembership.deleteMany({ where: { segmentId } });

    if (evaluated.length) {
      await tx.segmentMembership.createMany({
        data: evaluated.map((subscriber) => ({
          segmentId,
          subscriberId: subscriber.id,
        })),
        skipDuplicates: true,
      });
    }

    await tx.segment.update({
      where: { id: segmentId },
      data: { subscriberCount: evaluated.length },
    });
  });

  return evaluated.length;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize") ?? "20")));

    const segment = await db.segment.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { addedAt: "desc" },
          include: {
            subscriber: true,
          },
        },
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (!segment) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Segment not found" }, { status: 404 });
    }

    const members: SubscriberDetailRecord[] = segment.memberships.map((membership) => ({
      ...toSubscriberRecord({
        ...membership.subscriber,
        events: [],
      }),
      events: [],
      consentLog: [],
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        segment: toSegmentRecord(segment),
        members,
        totalMembers: segment._count.memberships,
        page,
        pageSize,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get segment";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await db.segment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Segment not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSegmentSchema.parse(body);

    const updated = await db.segment.update({
      where: { id: params.id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.rules !== undefined ? { rules: parsed.rules } : {}),
        ...(parsed.isDefault !== undefined ? { isDefault: parsed.isDefault } : {}),
      },
    });

    const rules = segmentRulesSchema.parse(updated.rules);
    const subscriberCount = await evaluateAndPersistSegmentMembers(updated.id, updated.workspaceId, rules);

    return NextResponse.json<ApiResponse<SegmentRecord>>({
      success: true,
      data: {
        ...toSegmentRecord(updated),
        subscriberCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update segment";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await db.segment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Segment not found" }, { status: 404 });
    }

    await db.segment.delete({ where: { id: params.id } });

    return NextResponse.json<ApiResponse>({ success: true, data: { id: params.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete segment";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}
