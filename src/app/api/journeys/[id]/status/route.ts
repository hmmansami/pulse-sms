import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId(request);
    const body = (await request.json()) as { status?: "active" | "paused" | "draft" };

    if (!body.status || !["active", "paused", "draft"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const existing = await db.journey.findFirst({
      where: {
        id: params.id,
        workspaceId,
      },
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
      data: { status: body.status },
    });

    return NextResponse.json({
      success: true,
      data: journey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update status",
      },
      { status: 500 }
    );
  }
}
