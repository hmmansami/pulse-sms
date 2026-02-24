import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.string().optional(),
  segmentIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  sentAt: z.string().datetime().nullable().optional(),
  content: z
    .object({
      body: z.string().optional(),
      subject: z.string().optional(),
      preheader: z.string().optional(),
      imageUrl: z.string().optional(),
      blocks: z.array(z.any()).optional(),
    })
    .optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            status: true,
            channel: true,
            sentAt: true,
            deliveredAt: true,
            clickedAt: true,
            revenue: true,
            subscriberId: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get campaign" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = updateCampaignSchema.parse(await request.json());

    const campaign = await db.campaign.update({
      where: { id: params.id },
      data: {
        name: payload.name,
        status: payload.status,
        segmentIds: payload.segmentIds,
        scheduledAt: payload.scheduledAt === undefined ? undefined : payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        sentAt: payload.sentAt === undefined ? undefined : payload.sentAt ? new Date(payload.sentAt) : null,
        content: payload.content,
      },
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update campaign" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.message.deleteMany({ where: { campaignId: params.id } });
    await db.campaign.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete campaign" },
      { status: 500 },
    );
  }
}
