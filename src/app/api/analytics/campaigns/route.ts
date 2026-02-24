import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function parseRange(request: NextRequest) {
  const toParam = request.nextUrl.searchParams.get("to");
  const fromParam = request.nextUrl.searchParams.get("from");
  const end = toParam ? new Date(`${toParam}T23:59:59.999Z`) : new Date();
  const start = fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86400000);
  return { start, end };
}

async function resolveWorkspaceId(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? request.headers.get("x-workspace-id");
  if (workspaceId) return workspaceId;
  const workspace = await db.workspace.findFirst({ select: { id: true } });
  return workspace?.id;
}

export async function GET(request: NextRequest) {
  const workspaceId = await resolveWorkspaceId(request);
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "No workspace available" }, { status: 400 });
  }

  const { start, end } = parseRange(request);
  const campaigns = await db.campaign.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      messages: {
        where: {
          sentAt: { gte: start, lte: end },
        },
        select: {
          status: true,
          clickedAt: true,
          revenue: true,
          sentAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const rows = campaigns
    .map((campaign) => {
      const sent = campaign.messages.filter((m) => Boolean(m.sentAt)).length;
      const delivered = campaign.messages.filter((m) => m.status === "delivered").length;
      const clicked = campaign.messages.filter((m) => Boolean(m.clickedAt)).length;
      const revenue = campaign.messages.reduce((sum, message) => sum + (message.revenue ?? 0), 0);
      return { id: campaign.id, name: campaign.name, sent, delivered, clicked, revenue };
    })
    .filter((row) => row.sent > 0 || row.revenue > 0 || row.clicked > 0);

  return NextResponse.json({ success: true, data: rows });
}
