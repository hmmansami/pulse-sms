import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

const workspaceUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  timezone: z.string().min(2).max(80).optional(),
  twilioSid: z.string().optional().nullable(),
  twilioToken: z.string().optional().nullable(),
  twilioPhone: z.string().optional().nullable(),
  resendKey: z.string().optional().nullable(),
  openaiKey: z.string().optional().nullable(),
});

async function resolveWorkspaceId(request: Request, userId: string, fallback?: string) {
  const headerId = request.headers.get("x-workspace-id") || fallback;
  if (headerId) {
    const membership = await db.workspaceMember.findFirst({
      where: { userId, workspaceId: headerId },
    });
    if (membership) return headerId;
  }

  const firstMembership = await db.workspaceMember.findFirst({
    where: { userId },
    orderBy: {
      workspace: {
        createdAt: "asc",
      },
    },
  });

  return firstMembership?.workspaceId;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await resolveWorkspaceId(request, session.user.id, session.user.workspaceId);

  if (!workspaceId) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json<ApiResponse>({ success: true, data: workspace });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await resolveWorkspaceId(request, session.user.id, session.user.workspaceId);

  if (!workspaceId) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
  });

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = workspaceUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const workspace = await db.workspace.update({
    where: { id: workspaceId },
    data: parsed.data,
  });

  return NextResponse.json<ApiResponse>({ success: true, data: workspace });
}
