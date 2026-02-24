export type SendSMSInput = {
  workspaceId: string;
  subscriberId: string;
  to?: string | null;
  body: string;
};

export type SendEmailInput = {
  workspaceId: string;
  subscriberId: string;
  to?: string | null;
  subject: string;
  body: string;
};

export type SendResult = {
  success: boolean;
  externalId?: string;
  error?: string;
};

// Task 3 is expected to replace these with Twilio/Resend integrations.
export async function sendSMS(input: SendSMSInput): Promise<SendResult> {
  if (!input.to) {
    return { success: false, error: "Missing subscriber phone number" };
  }

  return { success: true, externalId: `sms_stub_${Date.now()}` };
}

// Task 3 is expected to replace these with Twilio/Resend integrations.
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  if (!input.to) {
    return { success: false, error: "Missing subscriber email" };
  }

  return { success: true, externalId: `email_stub_${Date.now()}` };
}
