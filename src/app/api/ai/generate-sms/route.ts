import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSmsVariants } from "@/lib/ai/generate";

const schema = z.object({
  product: z.string().min(1),
  offer: z.string().min(1),
  goal: z.string().optional(),
  brandVoice: z
    .object({
      tone: z.string().optional(),
      audience: z.string().optional(),
      mustInclude: z.string().optional(),
      avoid: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = schema.parse(json);

    const variants = await generateSmsVariants({
      product: parsed.product,
      offer: parsed.offer,
      goal: parsed.goal,
      brandVoice: parsed.brandVoice,
    });

    return NextResponse.json({ success: true, data: variants });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate SMS copy";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
