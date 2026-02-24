import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateEmailSubjectLines } from "@/lib/ai/generate";

const schema = z.object({
  product: z.string().min(1),
  offer: z.string().min(1),
  audience: z.string().optional(),
  workspaceId: z.string().optional(),
  brandVoice: z
    .object({
      tone: z.string().optional(),
      audience: z.string().optional(),
      mustInclude: z.string().optional(),
      avoid: z.string().optional(),
    })
    .optional(),
});

async function resolveOpenAiKey(workspaceId?: string) {
  if (!workspaceId) return process.env.OPENAI_API_KEY;
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { openaiKey: true },
  });
  return workspace?.openaiKey ?? process.env.OPENAI_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = schema.parse(json);
    const apiKey = await resolveOpenAiKey(parsed.workspaceId);

    const lines = await generateEmailSubjectLines({
      product: parsed.product,
      offer: parsed.offer,
      audience: parsed.audience,
      brandVoice: parsed.brandVoice,
      apiKey,
    });

    return NextResponse.json({ success: true, data: lines });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate subject lines";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
