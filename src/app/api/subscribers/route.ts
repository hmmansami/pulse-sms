import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import type { ApiResponse, PaginatedResponse, SubscriberDetailRecord, SubscriberListQuery, SubscriberRecord } from "@/types";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  status: z.enum(["all", "active", "unsubscribed"]).optional().default("all"),
  tag: z.string().optional().default(""),
  sortBy: z.enum(["createdAt", "updatedAt", "firstName", "lastName", "email"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  workspaceId: z.string().optional(),
});

const createSubscriberSchema = z
  .object({
    workspaceId: z.string().optional(),
    phone: z.string().trim().optional().nullable(),
    email: z.string().trim().email().optional().nullable(),
    firstName: z.string().trim().optional().nullable(),
    lastName: z.string().trim().optional().nullable(),
    smsConsent: z.boolean().optional().default(false),
    emailConsent: z.boolean().optional().default(false),
    source: z.string().trim().optional().nullable(),
    customAttrs: z.record(z.unknown()).optional().default({}),
    timezone: z.string().trim().optional().nullable(),
    country: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.phone && !value.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either phone or email is required",
        path: ["phone"],
      });
    }
  });

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

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
}): SubscriberRecord {
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

export async function GET(request: NextRequest) {
  try {
    const parsed = listQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      tag: request.nextUrl.searchParams.get("tag") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      workspaceId: request.nextUrl.searchParams.get("workspaceId") ?? undefined,
    }) as Required<SubscriberListQuery> & { workspaceId?: string };

    const workspaceId = await resolveWorkspaceId(request, parsed.workspaceId);

    if (!workspaceId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    const where = {
      workspaceId,
      ...(parsed.status === "active" ? { smsConsent: true } : {}),
      ...(parsed.status === "unsubscribed" ? { smsConsent: false } : {}),
      ...(parsed.tag ? { tags: { has: parsed.tag } } : {}),
      ...(parsed.search
        ? {
            OR: [
              { firstName: { contains: parsed.search, mode: "insensitive" as const } },
              { lastName: { contains: parsed.search, mode: "insensitive" as const } },
              { email: { contains: parsed.search, mode: "insensitive" as const } },
              { phone: { contains: parsed.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.subscriber.findMany({
        where,
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
        orderBy: { [parsed.sortBy]: parsed.sortOrder },
      }),
      db.subscriber.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<SubscriberRecord>> = {
      success: true,
      data: {
        items: items.map(toSubscriberRecord),
        total,
        page: parsed.page,
        pageSize: parsed.pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list subscribers";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSubscriberSchema.parse(body);
    const workspaceId = await resolveWorkspaceId(request, parsed.workspaceId);

    if (!workspaceId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    const now = new Date();

    const subscriber = await db.subscriber.create({
      data: {
        workspaceId,
        phone: normalizeNullableString(parsed.phone),
        email: normalizeNullableString(parsed.email),
        firstName: normalizeNullableString(parsed.firstName),
        lastName: normalizeNullableString(parsed.lastName),
        smsConsent: parsed.smsConsent,
        emailConsent: parsed.emailConsent,
        smsOptInAt: parsed.smsConsent ? now : null,
        emailOptInAt: parsed.emailConsent ? now : null,
        source: normalizeNullableString(parsed.source) ?? "api",
        customAttrs: parsed.customAttrs ? JSON.parse(JSON.stringify(parsed.customAttrs)) : undefined,
        timezone: normalizeNullableString(parsed.timezone),
        country: normalizeNullableString(parsed.country),
        city: normalizeNullableString(parsed.city),
        tags: parsed.tags,
      },
    });

    if (parsed.smsConsent || parsed.emailConsent) {
      await db.consentLog.createMany({
        data: [
          ...(parsed.smsConsent
            ? [
                {
                  subscriberId: subscriber.id,
                  channel: "sms",
                  action: "opt_in",
                  method: "api",
                },
              ]
            : []),
          ...(parsed.emailConsent
            ? [
                {
                  subscriberId: subscriber.id,
                  channel: "email",
                  action: "opt_in",
                  method: "api",
                },
              ]
            : []),
        ],
      });
    }

    const response: ApiResponse<SubscriberDetailRecord> = {
      success: true,
      data: {
        ...toSubscriberRecord(subscriber),
        events: [],
        consentLog: [],
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create subscriber";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}
