import { NextRequest } from "next/server";

import { db } from "@/lib/db";

const WORKSPACE_HEADER = "x-workspace-id";

export async function getDefaultWorkspaceId(): Promise<string> {
  if (process.env.DEFAULT_WORKSPACE_ID) {
    return process.env.DEFAULT_WORKSPACE_ID;
  }

  const workspace = await db.workspace.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!workspace) {
    throw new Error("No workspace found. Set DEFAULT_WORKSPACE_ID or create a workspace first.");
  }

  return workspace.id;
}

export async function resolveWorkspaceIdFromRequest(
  request: NextRequest,
  bodyWorkspaceId?: string,
): Promise<string> {
  const paramWorkspace = request.nextUrl.searchParams.get("workspaceId") ?? undefined;
  const headerWorkspace = request.headers.get(WORKSPACE_HEADER) ?? undefined;

  const workspaceId = bodyWorkspaceId || paramWorkspace || headerWorkspace;

  if (workspaceId) {
    return workspaceId;
  }

  return getDefaultWorkspaceId();
}
