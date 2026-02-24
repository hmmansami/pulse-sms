import { NextRequest, NextResponse } from "next/server";

let handlers: { GET: Function; POST: Function };
let importError: string | null = null;

try {
  const mod = require("@/lib/auth");
  handlers = mod.handlers;
} catch (e: unknown) {
  importError = e instanceof Error ? e.stack || e.message : String(e);
  handlers = {
    GET: () => NextResponse.json({ error: importError }, { status: 500 }),
    POST: () => NextResponse.json({ error: importError }, { status: 500 }),
  };
}

export async function GET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack || e.message : String(e);
    return NextResponse.json({ error: msg, importError }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack || e.message : String(e);
    return NextResponse.json({ error: msg, importError }, { status: 500 });
  }
}
