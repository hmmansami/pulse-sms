import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { CAMPAIGN_TYPES } from "@/lib/campaigns/types";
import { resolveWorkspaceIdFromRequest } from "@/lib/workspace";

const createCampaignSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(CAMPAIGN_TYPES),
  content: z.object({
    body: z.string().default(""),
    subject: z.string().optional(),
    preheader: z.string().optional(),
    imageUrl: z.string().optional(),
    blocks: z.array(z.any()).optional(),
  }),
  segmentIds: z.array(z.string()).default([]),
  scheduledAt: z.string().datetime().optional(),
  status: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const workspaceId = await resolveWorkspaceIdFromRequest(request);
    const campaigns = await db.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to list campaigns" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const payload = createCampaignSchema.parse(rawBody);
    const workspaceId = await resolveWorkspaceIdFromRequest(request, payload.workspaceId);

    const campaign = await db.campaign.create({
      data: {
        workspaceId,
        name: payload.name,
        type: payload.type,
        content: payload.content,
        segmentIds: payload.segmentIds,
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        status: payload.status ?? (payload.scheduledAt ? "scheduled" : "draft"),
      },
    });

    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create campaign" },
      { status: 500 },
    );
  }
}
