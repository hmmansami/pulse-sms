import { NextRequest, NextResponse } from "next/server";
import { processIncomingEvent } from "@/lib/journeys/engine";
import { ensureWorkspace, getWorkspaceId } from "@/lib/workspace";

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId(request);
    await ensureWorkspace(workspaceId);

    const body = (await request.json()) as {
      type?: string;
      subscriberId?: string;
      properties?: Record<string, unknown>;
    };

    if (!body.type) {
      return NextResponse.json(
        { success: false, error: "Event type is required" },
        { status: 400 }
      );
    }

    const result = await processIncomingEvent({
      workspaceId,
      type: body.type,
      subscriberId: body.subscriberId,
      properties: body.properties,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to ingest event",
      },
      { status: 500 }
    );
  }
}
