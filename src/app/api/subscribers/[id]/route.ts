import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import type { ApiResponse, SubscriberDetailRecord, SubscriberRecord } from "@/types";

const updateSubscriberSchema = z
  .object({
    phone: z.string().trim().optional().nullable(),
    email: z.string().trim().email().optional().nullable(),
    firstName: z.string().trim().optional().nullable(),
    lastName: z.string().trim().optional().nullable(),
    smsConsent: z.boolean().optional(),
    emailConsent: z.boolean().optional(),
    source: z.string().trim().optional().nullable(),
    customAttrs: z.record(z.unknown()).optional(),
    timezone: z.string().trim().optional().nullable(),
    country: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
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

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const subscriber = await db.subscriber.findUnique({
      where: { id: params.id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            type: true,
            properties: true,
            createdAt: true,
          },
        },
        consentLog: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            channel: true,
            action: true,
            method: true,
            createdAt: true,
          },
        },
      },
    });

    if (!subscriber) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Subscriber not found" }, { status: 404 });
    }

    const response: ApiResponse<SubscriberDetailRecord> = {
      success: true,
      data: {
        ...toSubscriberRecord(subscriber),
        events: subscriber.events.map((event) => ({
          ...event,
          properties: event.properties && typeof event.properties === "object" ? (event.properties as Record<string, unknown>) : null,
          createdAt: event.createdAt.toISOString(),
        })),
        consentLog: subscriber.consentLog.map((entry) => ({
          ...entry,
          channel: entry.channel as "sms" | "email",
          action: entry.action as "opt_in" | "opt_out",
          createdAt: entry.createdAt.toISOString(),
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get subscriber";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = updateSubscriberSchema.parse(body);

    const existing = await db.subscriber.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Subscriber not found" }, { status: 404 });
    }

    const smsConsentChanged = parsed.smsConsent !== undefined && parsed.smsConsent !== existing.smsConsent;
    const emailConsentChanged = parsed.emailConsent !== undefined && parsed.emailConsent !== existing.emailConsent;
    const now = new Date();

    const updated = await db.subscriber.update({
      where: { id: params.id },
      data: {
        ...(parsed.phone !== undefined ? { phone: normalizeNullableString(parsed.phone) } : {}),
        ...(parsed.email !== undefined ? { email: normalizeNullableString(parsed.email) } : {}),
        ...(parsed.firstName !== undefined ? { firstName: normalizeNullableString(parsed.firstName) } : {}),
        ...(parsed.lastName !== undefined ? { lastName: normalizeNullableString(parsed.lastName) } : {}),
        ...(parsed.smsConsent !== undefined
          ? {
              smsConsent: parsed.smsConsent,
              smsOptInAt: parsed.smsConsent ? existing.smsOptInAt ?? now : existing.smsOptInAt,
              smsOptOutAt: parsed.smsConsent ? null : now,
            }
          : {}),
        ...(parsed.emailConsent !== undefined
          ? {
              emailConsent: parsed.emailConsent,
              emailOptInAt: parsed.emailConsent ? existing.emailOptInAt ?? now : existing.emailOptInAt,
              emailOptOutAt: parsed.emailConsent ? null : now,
            }
          : {}),
        ...(parsed.source !== undefined ? { source: normalizeNullableString(parsed.source) } : {}),
        ...(parsed.customAttrs !== undefined ? { customAttrs: JSON.parse(JSON.stringify(parsed.customAttrs)) } : {}),
        ...(parsed.timezone !== undefined ? { timezone: normalizeNullableString(parsed.timezone) } : {}),
        ...(parsed.country !== undefined ? { country: normalizeNullableString(parsed.country) } : {}),
        ...(parsed.city !== undefined ? { city: normalizeNullableString(parsed.city) } : {}),
        ...(parsed.tags !== undefined ? { tags: parsed.tags } : {}),
      },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            type: true,
            properties: true,
            createdAt: true,
          },
        },
        consentLog: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            channel: true,
            action: true,
            method: true,
            createdAt: true,
          },
        },
      },
    });

    if (smsConsentChanged || emailConsentChanged) {
      await db.consentLog.createMany({
        data: [
          ...(smsConsentChanged
            ? [
                {
                  subscriberId: updated.id,
                  channel: "sms",
                  action: updated.smsConsent ? "opt_in" : "opt_out",
                  method: "api",
                },
              ]
            : []),
          ...(emailConsentChanged
            ? [
                {
                  subscriberId: updated.id,
                  channel: "email",
                  action: updated.emailConsent ? "opt_in" : "opt_out",
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
        ...toSubscriberRecord(updated),
        events: updated.events.map((event) => ({
          ...event,
          properties: event.properties && typeof event.properties === "object" ? (event.properties as Record<string, unknown>) : null,
          createdAt: event.createdAt.toISOString(),
        })),
        consentLog: updated.consentLog.map((entry) => ({
          ...entry,
          channel: entry.channel as "sms" | "email",
          action: entry.action as "opt_in" | "opt_out",
          createdAt: entry.createdAt.toISOString(),
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update subscriber";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await db.subscriber.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Subscriber not found" }, { status: 404 });
    }

    await db.subscriber.delete({ where: { id: params.id } });

    return NextResponse.json<ApiResponse>({ success: true, data: { id: params.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete subscriber";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}
