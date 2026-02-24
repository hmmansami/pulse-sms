import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { decodeTrackingId } from "@/lib/messaging/tracking";

export async function GET(_: NextRequest, { params }: { params: { trackingId: string } }) {
  const payload = decodeTrackingId(params.trackingId);

  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid tracking link" }, { status: 400 });
  }

  if (payload.messageId) {
    await db.message.updateMany({
      where: { id: payload.messageId },
      data: {
        clickedAt: new Date(),
      },
    });
  }

  if (payload.workspaceId) {
    await db.event.create({
      data: {
        workspaceId: payload.workspaceId,
        subscriberId: payload.subscriberId,
        type: "click",
        properties: {
          campaignId: payload.campaignId,
          messageId: payload.messageId,
          url: payload.url,
          trackedAt: new Date().toISOString(),
        },
      },
    });
  }

  return NextResponse.redirect(payload.url);
}
