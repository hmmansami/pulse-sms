import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["popup", "flyout", "fullscreen", "banner", "embedded", "landing_page"]).optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
  design: z.record(z.any()).optional(),
  displayRules: z.record(z.any()).optional(),
  collectEmail: z.boolean().optional(),
  collectSms: z.boolean().optional(),
  offerType: z.string().nullable().optional(),
  offerValue: z.string().nullable().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const unit = await db.signupUnit.findUnique({ where: { id: params.id } });
  if (!unit) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: unit });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const parsed = updateSchema.parse(json);

    const updated = await db.signupUnit.update({
      where: { id: params.id },
      data: parsed,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.signupUnit.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 400 });
  }
}
