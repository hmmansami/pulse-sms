import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack || e.message : String(e);
    return NextResponse.json({ authError: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack || e.message : String(e);
    return NextResponse.json({ authError: msg }, { status: 500 });
  }
}
