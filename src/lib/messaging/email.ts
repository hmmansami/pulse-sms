import { Resend } from "resend";

import { db } from "@/lib/db";
import { getDefaultWorkspaceId } from "@/lib/workspace";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  workspaceId?: string;
  from?: string;
};

export type SendEmailResult = {
  id: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const workspaceId = input.workspaceId ?? (await getDefaultWorkspaceId());

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { resendKey: true },
  });

  const resendKey = workspace?.resendKey ?? process.env.RESEND_API_KEY;

  if (!resendKey) {
    throw new Error("Resend API key is not configured for this workspace.");
  }

  const resend = new Resend(resendKey);
  const from = input.from ?? process.env.RESEND_FROM_EMAIL ?? "Pulse <onboarding@resend.dev>";

  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    id: result.data?.id ?? "unknown",
  };
}
