import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateSmsVariants } from "@/lib/ai/generate";

const schema = z.object({
  product: z.string().min(1),
  offer: z.string().min(1),
  goal: z.string().optional(),
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

    const variants = await generateSmsVariants({
      product: parsed.product,
      offer: parsed.offer,
      goal: parsed.goal,
      brandVoice: parsed.brandVoice,
      apiKey,
    });

    return NextResponse.json({ success: true, data: variants });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate SMS copy";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
