import { Queue } from "bullmq";
import IORedis from "ioredis";

export type JourneyStepJobData = {
  journeyId: string;
  subscriberId: string;
  nodeId: string;
};

const redisUrl = process.env.REDIS_URL;
const connection = redisUrl
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    })
  : null;

export const journeyQueue = connection
  ? new Queue<JourneyStepJobData>("journey-step", { connection })
  : null;

export async function enqueueJourneyStep(data: JourneyStepJobData, delayMs: number) {
  if (!journeyQueue) return;

  await journeyQueue.add("advance-step", data, {
    delay: Math.max(0, delayMs),
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}
