import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function parseRange(request: NextRequest) {
  const toParam = request.nextUrl.searchParams.get("to");
  const fromParam = request.nextUrl.searchParams.get("from");
  const end = toParam ? new Date(`${toParam}T23:59:59.999Z`) : new Date();
  const start = fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86400000);
  return { start, end };
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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

  const [messages, purchases] = await Promise.all([
    db.message.findMany({
      where: {
        workspaceId,
        sentAt: { gte: start, lte: end },
      },
      select: {
        sentAt: true,
        revenue: true,
      },
    }),
    db.event.findMany({
      where: {
        workspaceId,
        type: "purchase",
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        properties: true,
      },
    }),
  ]);

  const rowsMap = new Map<string, { date: string; messageRevenue: number; purchaseRevenue: number }>();

  for (let current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    const key = toDateKey(current);
    rowsMap.set(key, { date: key, messageRevenue: 0, purchaseRevenue: 0 });
  }

  for (const message of messages) {
    if (!message.sentAt) continue;
    const key = toDateKey(message.sentAt);
    const bucket = rowsMap.get(key);
    if (bucket) bucket.messageRevenue += message.revenue ?? 0;
  }

  for (const purchase of purchases) {
    const key = toDateKey(purchase.createdAt);
    const bucket = rowsMap.get(key);
    if (!bucket) continue;

    let revenue = 0;
    if (purchase.properties && typeof purchase.properties === "object" && !Array.isArray(purchase.properties)) {
      const value = (purchase.properties as Record<string, unknown>).revenue;
      if (typeof value === "number") revenue = value;
      if (typeof value === "string") revenue = Number(value) || 0;
    }

    bucket.purchaseRevenue += revenue;
  }

  const data = Array.from(rowsMap.values());
  return NextResponse.json({ success: true, data });
}
