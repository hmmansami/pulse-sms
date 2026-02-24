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

  const [beforeCount, rangeSubscribers] = await Promise.all([
    db.subscriber.count({
      where: {
        workspaceId,
        createdAt: { lt: start },
      },
    }),
    db.subscriber.findMany({
      where: {
        workspaceId,
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const map = new Map<string, number>();
  for (const item of rangeSubscribers) {
    const key = toDateKey(item.createdAt);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const points: Array<{ date: string; value: number }> = [];
  let running = beforeCount;
  for (let current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    const key = toDateKey(current);
    running += map.get(key) ?? 0;
    points.push({ date: key, value: running });
  }

  return NextResponse.json({ success: true, data: points });
}
