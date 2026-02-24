import { Job, Worker } from "bullmq";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/messaging/email";
import { sendSMS } from "@/lib/messaging/sms";
import { normalizeCampaignContent } from "@/lib/campaigns/types";
import { decodeTrackingId, wrapTrackingUrls } from "@/lib/messaging/tracking";
import { CAMPAIGN_QUEUE_NAME } from "@/lib/queue/setup";
import IORedis from "ioredis";

type SendCampaignJobData = {
  campaignId: string;
  workspaceId: string;
};

type SendTestJobData = SendCampaignJobData & {
  to: string;
};

async function getCampaignRecipients(campaignId: string): Promise<Array<{ id: string; phone: string | null; email: string | null; firstName: string | null }>> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { workspaceId: true, segmentIds: true },
  });

  if (!campaign) {
    return [];
  }

  if (campaign.segmentIds.length === 0) {
    return db.subscriber.findMany({
      where: { workspaceId: campaign.workspaceId },
      select: { id: true, phone: true, email: true, firstName: true },
    });
  }

  const memberships = await db.segmentMembership.findMany({
    where: {
      segmentId: { in: campaign.segmentIds },
      subscriber: { workspaceId: campaign.workspaceId },
    },
    select: {
      subscriber: {
        select: { id: true, phone: true, email: true, firstName: true },
      },
    },
  });

  const byId = new Map<string, { id: string; phone: string | null; email: string | null; firstName: string | null }>();
  for (const item of memberships) {
    byId.set(item.subscriber.id, item.subscriber);
  }

  return Array.from(byId.values());
}

function personalizeText(body: string, firstName: string | null): string {
  return body.replaceAll("{{first_name}}", firstName || "there");
}

async function processCampaign(job: Job<SendCampaignJobData>): Promise<void> {
  const campaign = await db.campaign.findUnique({
    where: { id: job.data.campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const content = normalizeCampaignContent(campaign.content);
  const recipients = await getCampaignRecipients(campaign.id);

  for (const subscriber of recipients) {
    const message = await db.message.create({
      data: {
        workspaceId: campaign.workspaceId,
        subscriberId: subscriber.id,
        campaignId: campaign.id,
        channel: campaign.type,
        status: "queued",
        content: campaign.content,
      },
    });

    const trackedBody = wrapTrackingUrls(content.body || "", {
      workspaceId: campaign.workspaceId,
      campaignId: campaign.id,
      messageId: message.id,
      subscriberId: subscriber.id,
    });

    try {
      if (campaign.type === "sms" && subscriber.phone) {
        const result = await sendSMS({
          workspaceId: campaign.workspaceId,
          to: subscriber.phone,
          body: personalizeText(trackedBody, subscriber.firstName),
          imageUrl: content.imageUrl,
        });

        await db.message.update({
          where: { id: message.id },
          data: {
            status: "sent",
            sentAt: new Date(),
            externalId: result.id,
          },
        });
      }

      if (campaign.type === "email" && subscriber.email) {
        const emailBody = personalizeText(trackedBody, subscriber.firstName);
        const result = await sendEmail({
          workspaceId: campaign.workspaceId,
          to: subscriber.email,
          subject: content.subject ?? campaign.name,
          html: `<div style=\"font-family:Arial,sans-serif;line-height:1.5;\">${emailBody}</div>`,
          text: emailBody,
        });

        await db.message.update({
          where: { id: message.id },
          data: {
            status: "sent",
            sentAt: new Date(),
            externalId: result.id,
          },
        });
      }
    } catch {
      await db.message.update({
        where: { id: message.id },
        data: { status: "failed" },
      });
    }
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: {
      status: "sent",
      sentAt: new Date(),
      sendCount: recipients.length,
    },
  });
}

async function processTest(job: Job<SendTestJobData>): Promise<void> {
  const campaign = await db.campaign.findUnique({
    where: { id: job.data.campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const content = normalizeCampaignContent(campaign.content);

  if (campaign.type === "sms") {
    await sendSMS({
      workspaceId: campaign.workspaceId,
      to: job.data.to,
      body: content.body,
      imageUrl: content.imageUrl,
    });
    return;
  }

  await sendEmail({
    workspaceId: campaign.workspaceId,
    to: job.data.to,
    subject: content.subject ?? `Test: ${campaign.name}`,
    html: `<div style=\"font-family:Arial,sans-serif;line-height:1.5;\">${content.body}</div>`,
    text: content.body,
  });
}

let worker: Worker | null = null;

export function startCampaignWorker(): Worker {
  if (worker) {
    return worker;
  }

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured.");
  }

  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  worker = new Worker(
    CAMPAIGN_QUEUE_NAME,
    async (job) => {
      if (job.name === "send-campaign") {
        await processCampaign(job as Job<SendCampaignJobData>);
        return;
      }

      if (job.name === "send-test") {
        await processTest(job as Job<SendTestJobData>);
        return;
      }

      throw new Error(`Unknown campaign queue job: ${job.name}`);
    },
    { connection },
  );

  return worker;
}

export function decodeTracking(trackingId: string) {
  return decodeTrackingId(trackingId);
}
