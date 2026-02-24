import twilio from "twilio";

import { db } from "@/lib/db";
import { getDefaultWorkspaceId } from "@/lib/workspace";

export type SendSMSInput = {
  to: string;
  body: string;
  imageUrl?: string;
  workspaceId?: string;
};

export type SendSMSResult = {
  id: string;
  status: string;
};

export async function sendSMS(input: SendSMSInput): Promise<SendSMSResult> {
  const workspaceId = input.workspaceId ?? (await getDefaultWorkspaceId());

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { twilioSid: true, twilioToken: true, twilioPhone: true },
  });

  const accountSid = workspace?.twilioSid ?? process.env.TWILIO_ACCOUNT_SID;
  const authToken = workspace?.twilioToken ?? process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = workspace?.twilioPhone ?? process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials are not configured for this workspace.");
  }

  const client = twilio(accountSid, authToken);

  const message = await client.messages.create({
    to: input.to,
    from: fromNumber,
    body: input.body,
    mediaUrl: input.imageUrl ? [input.imageUrl] : undefined,
  });

  return {
    id: message.sid,
    status: message.status,
  };
}
