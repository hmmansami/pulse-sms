import IORedis from "ioredis";
import { JobsOptions, Queue } from "bullmq";

export const CAMPAIGN_QUEUE_NAME = "campaign-send";

let redisConnection: IORedis | null = null;
let queue: Queue | null = null;

function getRedisConnection(): IORedis {
  if (redisConnection) {
    return redisConnection;
  }

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured.");
  }

  redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  return redisConnection;
}

function getCampaignQueue(): Queue {
  if (queue) {
    return queue;
  }

  queue = new Queue(CAMPAIGN_QUEUE_NAME, {
    connection: getRedisConnection(),
  });

  return queue;
}

export type QueueCampaignSendJob = {
  campaignId: string;
  workspaceId: string;
};

export type QueueCampaignTestJob = {
  campaignId: string;
  workspaceId: string;
  to: string;
};

export async function queueCampaignSend(
  payload: QueueCampaignSendJob,
  options?: JobsOptions,
): Promise<void> {
  await getCampaignQueue().add("send-campaign", payload, options);
}

export async function queueCampaignTest(payload: QueueCampaignTestJob): Promise<void> {
  await getCampaignQueue().add("send-test", payload);
}
