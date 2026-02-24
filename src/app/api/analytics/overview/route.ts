import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function parseDateRange(request: NextRequest) {
  const toParam = request.nextUrl.searchParams.get("to");
  const fromParam = request.nextUrl.searchParams.get("from");
  const end = toParam ? new Date(`${toParam}T23:59:59.999Z`) : new Date();
  const start = fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86400000);
  return { start, end };
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
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

  const { start, end } = parseDateRange(request);
  const windowMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - windowMs);

  const [
    totalSubscribers,
    previousSubscribers,
    currentMessages,
    previousMessages,
    revenueAgg,
    previousRevenueAgg,
    clickedCurrent,
    clickedPrevious,
  ] = await Promise.all([
    db.subscriber.count({ where: { workspaceId, createdAt: { lte: end } } }),
    db.subscriber.count({ where: { workspaceId, createdAt: { lte: previousEnd } } }),
    db.message.count({ where: { workspaceId, sentAt: { gte: start, lte: end } } }),
    db.message.count({ where: { workspaceId, sentAt: { gte: previousStart, lte: previousEnd } } }),
    db.message.aggregate({
      where: { workspaceId, sentAt: { gte: start, lte: end } },
      _sum: { revenue: true },
    }),
    db.message.aggregate({
      where: { workspaceId, sentAt: { gte: previousStart, lte: previousEnd } },
      _sum: { revenue: true },
    }),
    db.message.count({ where: { workspaceId, clickedAt: { gte: start, lte: end } } }),
    db.message.count({ where: { workspaceId, clickedAt: { gte: previousStart, lte: previousEnd } } }),
  ]);

  const totalRevenue = revenueAgg._sum.revenue ?? 0;
  const previousRevenue = previousRevenueAgg._sum.revenue ?? 0;
  const clickRate = currentMessages > 0 ? (clickedCurrent / currentMessages) * 100 : 0;
  const previousClickRate = previousMessages > 0 ? (clickedPrevious / previousMessages) * 100 : 0;

  return NextResponse.json({
    success: true,
    data: {
      totalSubscribers,
      messagesSent: currentMessages,
      clickRate,
      totalRevenue,
      trends: {
        subscribers: pctChange(totalSubscribers, previousSubscribers),
        messages: pctChange(currentMessages, previousMessages),
        clickRate: pctChange(clickRate, previousClickRate),
        revenue: pctChange(totalRevenue, previousRevenue),
      },
    },
  });
}
