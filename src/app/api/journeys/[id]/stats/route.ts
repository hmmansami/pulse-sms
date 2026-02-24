import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId(request);

    const journey = await db.journey.findFirst({
      where: {
        id: params.id,
        workspaceId,
      },
      select: { id: true },
    });

    if (!journey) {
      return NextResponse.json(
        { success: false, error: "Journey not found" },
        { status: 404 }
      );
    }

    const [entered, completed, active, smsSent, emailSent, revenueAgg] = await Promise.all([
      db.journeySubscriberState.count({ where: { journeyId: params.id } }),
      db.journeySubscriberState.count({ where: { journeyId: params.id, status: "completed" } }),
      db.journeySubscriberState.count({ where: { journeyId: params.id, status: "active" } }),
      db.message.count({ where: { journeyId: params.id, channel: "sms", status: "sent" } }),
      db.message.count({ where: { journeyId: params.id, channel: "email", status: "sent" } }),
      db.message.aggregate({
        where: { journeyId: params.id },
        _sum: { revenue: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        entered,
        active,
        completed,
        completionRate: entered > 0 ? completed / entered : 0,
        smsSent,
        emailSent,
        revenue: revenueAgg._sum.revenue ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch journey stats",
      },
      { status: 500 }
    );
  }
}
