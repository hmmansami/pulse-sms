import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { queueCampaignSend } from "@/lib/queue/setup";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, workspaceId: true },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: "sending" },
    });

    await queueCampaignSend({
      campaignId: campaign.id,
      workspaceId: campaign.workspaceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to queue campaign" },
      { status: 500 },
    );
  }
}
