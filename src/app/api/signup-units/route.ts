import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const signupUnitSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(["popup", "flyout", "fullscreen", "banner", "embedded", "landing_page"]),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
  design: z.record(z.any()),
  displayRules: z.record(z.any()),
  collectEmail: z.boolean().default(true),
  collectSms: z.boolean().default(true),
  offerType: z.string().nullable().optional(),
  offerValue: z.string().nullable().optional(),
});

async function resolveWorkspaceId(request: NextRequest, bodyWorkspaceId?: string) {
  const fromQuery = request.nextUrl.searchParams.get("workspaceId") ?? undefined;
  const fromHeader = request.headers.get("x-workspace-id") ?? undefined;
  const workspaceId = bodyWorkspaceId ?? fromQuery ?? fromHeader;
  if (workspaceId) return workspaceId;

  const workspace = await db.workspace.findFirst({ select: { id: true } });
  return workspace?.id;
}

export async function GET(request: NextRequest) {
  const workspaceId = await resolveWorkspaceId(request);
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "No workspace available" }, { status: 400 });
  }

  const units = await db.signupUnit.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: units });
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = signupUnitSchema.parse(json);
    const workspaceId = await resolveWorkspaceId(request, parsed.workspaceId);

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace available" }, { status: 400 });
    }

    const created = await db.signupUnit.create({
      data: {
        workspaceId,
        name: parsed.name,
        type: parsed.type,
        status: parsed.status,
        design: parsed.design,
        displayRules: parsed.displayRules,
        collectEmail: parsed.collectEmail,
        collectSms: parsed.collectSms,
        offerType: parsed.offerType ?? null,
        offerValue: parsed.offerValue ?? null,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create sign-up unit";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
