import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { evaluateSegment } from "@/lib/segments";
import type { ApiResponse, PaginatedResponse, SegmentRecord, SegmentRules, SubscriberRecord } from "@/types";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "subscriberCount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  workspaceId: z.string().optional(),
});

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

const createSegmentSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  rules: segmentRulesSchema,
  isDefault: z.boolean().optional().default(false),
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
    id: string;
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

async function resolveWorkspaceId(request: NextRequest, bodyWorkspaceId?: string): Promise<string | null> {
  const queryWorkspaceId = request.nextUrl.searchParams.get("workspaceId");
  const workspaceId = bodyWorkspaceId ?? queryWorkspaceId;

  if (workspaceId) {
    return workspaceId;
  }

  const firstWorkspace = await db.workspace.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return firstWorkspace?.id ?? null;
}

async function evaluateAndPersistSegmentMembers(segmentId: string, workspaceId: string, rules: SegmentRules): Promise<number> {
  const subscribers = await db.subscriber.findMany({
    where: { workspaceId },
    include: {
      events: {
        select: {
          id: true,
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

export async function GET(request: NextRequest) {
  try {
    const parsed = listQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      workspaceId: request.nextUrl.searchParams.get("workspaceId") ?? undefined,
    });

    const workspaceId = await resolveWorkspaceId(request, parsed.workspaceId);

    if (!workspaceId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    const where = {
      workspaceId,
      ...(parsed.search
        ? {
            OR: [
              { name: { contains: parsed.search, mode: "insensitive" as const } },
              { description: { contains: parsed.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.segment.findMany({
        where,
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
        orderBy: { [parsed.sortBy]: parsed.sortOrder },
      }),
      db.segment.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<SegmentRecord>> = {
      success: true,
      data: {
        items: items.map(toSegmentRecord),
        total,
        page: parsed.page,
        pageSize: parsed.pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list segments";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSegmentSchema.parse(body);
    const workspaceId = await resolveWorkspaceId(request, parsed.workspaceId);

    if (!workspaceId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    const segment = await db.segment.create({
      data: {
        workspaceId,
        name: parsed.name,
        description: parsed.description ?? null,
        rules: parsed.rules,
        isDefault: parsed.isDefault,
      },
    });

    const subscriberCount = await evaluateAndPersistSegmentMembers(segment.id, workspaceId, parsed.rules);

    const response: ApiResponse<SegmentRecord> = {
      success: true,
      data: {
        ...toSegmentRecord(segment),
        subscriberCount,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create segment";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}
