import { Worker } from "bullmq";
import IORedis from "ioredis";
import { advanceSubscriberInJourney } from "@/lib/journeys/engine";
import type { JourneyStepJobData } from "@/lib/queue/journey-queue";

const redisUrl = process.env.REDIS_URL;

export function startJourneyWorker() {
  if (!redisUrl) {
    return null;
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  return new Worker<JourneyStepJobData>(
    "journey-step",
    async (job) => {
      const { journeyId, subscriberId, nodeId } = job.data;
      await advanceSubscriberInJourney({
        journeyId,
        subscriberId,
        startNodeId: nodeId,
      });
    },
    {
      connection,
      concurrency: 20,
    }
  );
}
