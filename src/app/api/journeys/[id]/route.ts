import { NextRequest, NextResponse } from "next/server";
import type { JourneyEdge, JourneyNode, JourneyTrigger } from "@/types";
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
    });

    if (!journey) {
      return NextResponse.json(
        { success: false, error: "Journey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: journey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch journey",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId(request);
    const body = (await request.json()) as {
      name?: string;
      status?: "draft" | "active" | "paused";
      trigger?: JourneyTrigger;
      nodes?: JourneyNode[];
      edges?: JourneyEdge[];
    };

    const existing = await db.journey.findFirst({
      where: { id: params.id, workspaceId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Journey not found" },
        { status: 404 }
      );
    }

    const journey = await db.journey.update({
      where: { id: params.id },
      data: {
        name: body.name,
        status: body.status,
        ...(body.trigger ? { trigger: JSON.parse(JSON.stringify(body.trigger)) } : {}),
        ...(body.nodes ? { nodes: JSON.parse(JSON.stringify(body.nodes)) } : {}),
        ...(body.edges ? { edges: JSON.parse(JSON.stringify(body.edges)) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: journey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update journey",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId(request);

    const existing = await db.journey.findFirst({
      where: { id: params.id, workspaceId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Journey not found" },
        { status: 404 }
      );
    }

    await db.journeySubscriberState.deleteMany({
      where: { journeyId: params.id },
    });

    await db.journey.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      data: { id: params.id },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete journey",
      },
      { status: 500 }
    );
  }
}
