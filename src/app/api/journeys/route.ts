import { NextResponse } from "next/server";
import type { JourneyEdge, JourneyNode, JourneyTrigger } from "@/types";
import { db } from "@/lib/db";
import { ensureWorkspace, getWorkspaceId } from "@/lib/workspace";

const defaultNodes: JourneyNode[] = [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 80, y: 160 },
    data: { event: "subscriber_created" },
  },
];

const defaultEdges: JourneyEdge[] = [];
const defaultTrigger: JourneyTrigger = {
  type: "event",
  event: "subscriber_created",
};

export async function GET(request: Request) {
  try {
    const workspaceId = getWorkspaceId(request);

    const journeys = await db.journey.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: journeys,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list journeys",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = getWorkspaceId(request);
    await ensureWorkspace(workspaceId);

    const body = (await request.json()) as {
      name?: string;
      trigger?: JourneyTrigger;
      nodes?: JourneyNode[];
      edges?: JourneyEdge[];
      status?: string;
    };

    const journey = await db.journey.create({
      data: {
        workspaceId,
        name: body.name?.trim() || "Untitled Journey",
        status: body.status ?? "draft",
        trigger: body.trigger ?? defaultTrigger,
        nodes: body.nodes ?? defaultNodes,
        edges: body.edges ?? defaultEdges,
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
        error: error instanceof Error ? error.message : "Failed to create journey",
      },
      { status: 500 }
    );
  }
}
