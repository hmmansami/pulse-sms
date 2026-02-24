import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { queueCampaignSend } from "@/lib/queue/setup";

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = scheduleSchema.parse(await request.json());
    const campaign = await db.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, workspaceId: true },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    const scheduledAt = new Date(payload.scheduledAt);
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());

    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "scheduled",
        scheduledAt,
      },
    });

    await queueCampaignSend(
      {
        campaignId: campaign.id,
        workspaceId: campaign.workspaceId,
      },
      { delay },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to schedule campaign" },
      { status: 500 },
    );
  }
}
