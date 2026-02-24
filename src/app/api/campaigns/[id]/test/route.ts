import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { queueCampaignTest } from "@/lib/queue/setup";

const testSchema = z.object({
  to: z.string().min(3),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = testSchema.parse(await request.json());

    const campaign = await db.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, workspaceId: true },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    await queueCampaignTest({
      campaignId: campaign.id,
      workspaceId: campaign.workspaceId,
      to: payload.to,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to send test message" },
      { status: 500 },
    );
  }
}
