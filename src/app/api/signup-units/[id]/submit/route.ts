import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const submitSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  source: z.string().default("signup_unit"),
});

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const unit = await db.signupUnit.findUnique({ where: { id: params.id } });
    if (!unit) {
      return NextResponse.json({ success: false, error: "Sign-up unit not found" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = submitSchema.parse(json);

    if (!parsed.email && !parsed.phone) {
      return NextResponse.json(
        { success: false, error: "Email or phone is required" },
        { status: 400 }
      );
    }

    const existing = await db.subscriber.findFirst({
      where: {
        workspaceId: unit.workspaceId,
        OR: [
          ...(parsed.email ? [{ email: parsed.email }] : []),
          ...(parsed.phone ? [{ phone: parsed.phone }] : []),
        ],
      },
    });

    const now = new Date();
    const subscriber = existing
      ? await db.subscriber.update({
          where: { id: existing.id },
          data: {
            email: parsed.email ?? existing.email,
            phone: parsed.phone ?? existing.phone,
            firstName: parsed.firstName ?? existing.firstName,
            lastName: parsed.lastName ?? existing.lastName,
            emailConsent: parsed.email ? true : existing.emailConsent,
            smsConsent: parsed.phone ? true : existing.smsConsent,
            emailOptInAt: parsed.email ? existing.emailOptInAt ?? now : existing.emailOptInAt,
            smsOptInAt: parsed.phone ? existing.smsOptInAt ?? now : existing.smsOptInAt,
            source: parsed.source,
          },
        })
      : await db.subscriber.create({
          data: {
            workspaceId: unit.workspaceId,
            email: parsed.email,
            phone: parsed.phone,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            emailConsent: Boolean(parsed.email),
            smsConsent: Boolean(parsed.phone),
            emailOptInAt: parsed.email ? now : null,
            smsOptInAt: parsed.phone ? now : null,
            source: parsed.source,
          },
        });

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    if (parsed.email) {
      await db.consentLog.create({
        data: {
          subscriberId: subscriber.id,
          channel: "email",
          action: "opt_in",
          method: "form",
          ipAddress: ip,
          userAgent,
          metadata: { signupUnitId: unit.id },
        },
      });
    }

    if (parsed.phone) {
      await db.consentLog.create({
        data: {
          subscriberId: subscriber.id,
          channel: "sms",
          action: "opt_in",
          method: "two_tap",
          ipAddress: ip,
          userAgent,
          metadata: { signupUnitId: unit.id },
        },
      });
    }

    await db.signupUnit.update({
      where: { id: unit.id },
      data: { submissions: { increment: 1 } },
    });

    await db.event.create({
      data: {
        workspaceId: unit.workspaceId,
        subscriberId: subscriber.id,
        type: "signup",
        properties: {
          signupUnitId: unit.id,
          source: parsed.source,
        },
      },
    });

    return NextResponse.json({ success: true, data: { subscriberId: subscriber.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
