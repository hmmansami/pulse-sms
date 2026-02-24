import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function ensureWorkspace(workspaceId: string) {
  const safeId = workspaceId.trim() || "demo-workspace";

  return db.workspace.upsert({
    where: { id: safeId },
    update: {},
    create: {
      id: safeId,
      name: "Demo Workspace",
      slug: generateSlug(`workspace-${safeId}`),
    },
  });
}

export function getWorkspaceId(request: Request): string {
  const url = new URL(request.url);

  return (
    request.headers.get("x-workspace-id") ||
    url.searchParams.get("workspaceId") ||
    "demo-workspace"
  );
}
