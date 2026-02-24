import type { CampaignContent } from "@/types";

export const CAMPAIGN_STATUSES = ["draft", "scheduled", "sending", "sent", "paused"] as const;
export const CAMPAIGN_TYPES = ["sms", "email"] as const;

export type CampaignStatusValue = (typeof CAMPAIGN_STATUSES)[number];
export type CampaignTypeValue = (typeof CAMPAIGN_TYPES)[number];

export function normalizeCampaignContent(content: unknown): CampaignContent {
  if (!content || typeof content !== "object") {
    return { body: "" };
  }

  const candidate = content as CampaignContent;

  return {
    body: typeof candidate.body === "string" ? candidate.body : "",
    subject: typeof candidate.subject === "string" ? candidate.subject : undefined,
    preheader: typeof candidate.preheader === "string" ? candidate.preheader : undefined,
    imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : undefined,
    blocks: Array.isArray(candidate.blocks) ? candidate.blocks : undefined,
  };
}
