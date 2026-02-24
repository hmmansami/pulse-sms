import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const unit = await db.signupUnit.findUnique({ where: { id: params.id } });
  if (!unit) {
    return NextResponse.json({ success: false, error: "Sign-up unit not found" }, { status: 404 });
  }

  await db.signupUnit.update({ where: { id: unit.id }, data: { views: { increment: 1 } } });

  await db.event.create({
    data: {
      workspaceId: unit.workspaceId,
      type: "page_view",
      properties: { signupUnitId: unit.id, event: "signup_unit_view" },
    },
  });

  return NextResponse.json({ success: true });
}
