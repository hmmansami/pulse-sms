import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import type { ApiResponse } from "@/types";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const { name, email, password, workspaceName } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Email already in use" }, { status: 409 });
    }

    const baseSlug = generateSlug(workspaceName) || "workspace";
    let slug = baseSlug;
    let counter = 1;

    while (await db.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const hashed = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        workspaces: {
          create: {
            role: "owner",
            workspace: {
              create: {
                name: workspaceName,
                slug,
              },
            },
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<{ userId: string }>>({
      success: true,
      data: { userId: user.id },
    });
  } catch {
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to register account" }, { status: 500 });
  }
}
