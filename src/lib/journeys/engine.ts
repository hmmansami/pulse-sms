import type { JourneyEdge, JourneyNode, SegmentCondition } from "@/types";
import { db } from "@/lib/db";
import { sendEmail, sendSMS } from "@/lib/messaging";
import { evaluateConditions } from "@/lib/journeys/evaluator";
import { enqueueJourneyStep } from "@/lib/queue/journey-queue";

type EngineEvent = {
  id?: string;
  type: string;
  properties?: Record<string, unknown> | null;
};

type JourneyPayload = {
  id: string;
  workspaceId: string;
  nodes: JourneyNode[];
  edges: JourneyEdge[];
};

function parseJourneyJson(value: unknown) {
  return (Array.isArray(value) ? value : []) as JourneyNode[];
}

function parseEdgesJson(value: unknown) {
  return (Array.isArray(value) ? value : []) as JourneyEdge[];
}

function nextNodeId(edges: JourneyEdge[], source: string, label?: string) {
  if (label) {
    const labeled = edges.find((edge) => edge.source === source && edge.label === label);
    if (labeled) return labeled.target;
  }

  return edges.find((edge) => edge.source === source)?.target;
}

function delayToMs(data: Record<string, unknown>): number {
  const amount = Number(data.amount ?? 0);
  const unit = String(data.unit ?? "minutes");

  if (!amount || amount < 0) return 0;
  if (unit === "days") return amount * 24 * 60 * 60 * 1000;
  if (unit === "hours") return amount * 60 * 60 * 1000;

  return amount * 60 * 1000;
}

async function processJourney(
  journey: JourneyPayload,
  subscriberId: string,
  startNodeId: string,
  event?: EngineEvent
) {
  const subscriber = await db.subscriber.findUnique({
    where: { id: subscriberId },
  });

  if (!subscriber) return;

  let pointer: string | undefined = startNodeId;

  while (pointer) {
    const node = journey.nodes.find((item) => item.id === pointer);

    if (!node) {
      pointer = undefined;
      break;
    }

    await db.journeySubscriberState.update({
      where: {
        journeyId_subscriberId: {
          journeyId: journey.id,
          subscriberId,
        },
      },
      data: {
        currentNodeId: node.id,
      },
    });

    if (node.type === "trigger") {
      pointer = nextNodeId(journey.edges, node.id);
      continue;
    }

    if (node.type === "delay") {
      const delayMs = delayToMs(node.data);
      const targetNodeId = nextNodeId(journey.edges, node.id);

      if (!targetNodeId) {
        pointer = undefined;
        break;
      }

      if (delayMs <= 0 || !process.env.REDIS_URL) {
        pointer = targetNodeId;
        continue;
      }

      await enqueueJourneyStep(
        {
          journeyId: journey.id,
          subscriberId,
          nodeId: targetNodeId,
        },
        delayMs
      );

      return;
    }

    if (node.type === "send_sms") {
      const body = String(node.data.body ?? "");
      const result = await sendSMS({
        workspaceId: journey.workspaceId,
        subscriberId,
        to: subscriber.phone,
        body,
      });

      await db.message.create({
        data: {
          workspaceId: journey.workspaceId,
          subscriberId,
          journeyId: journey.id,
          channel: "sms",
          content: { body },
          status: result.success ? "sent" : "failed",
          sentAt: result.success ? new Date() : null,
          externalId: result.externalId,
        },
      });

      pointer = nextNodeId(journey.edges, node.id);
      continue;
    }

    if (node.type === "send_email") {
      const subject = String(node.data.subject ?? "");
      const body = String(node.data.body ?? "");
      const result = await sendEmail({
        workspaceId: journey.workspaceId,
        subscriberId,
        to: subscriber.email,
        subject,
        body,
      });

      await db.message.create({
        data: {
          workspaceId: journey.workspaceId,
          subscriberId,
          journeyId: journey.id,
          channel: "email",
          content: { subject, body },
          status: result.success ? "sent" : "failed",
          sentAt: result.success ? new Date() : null,
          externalId: result.externalId,
        },
      });

      pointer = nextNodeId(journey.edges, node.id);
      continue;
    }

    if (node.type === "condition") {
      const conditions = (node.data.conditions ?? []) as SegmentCondition[];
      const logic = (node.data.logic ?? "and") as "and" | "or";

      const passed = evaluateConditions(conditions, logic, {
        subscriber: {
          firstName: subscriber.firstName,
          lastName: subscriber.lastName,
          phone: subscriber.phone,
          email: subscriber.email,
          tags: subscriber.tags,
          customAttrs: (subscriber.customAttrs ?? {}) as Record<string, unknown>,
        },
        event,
      });

      pointer = nextNodeId(journey.edges, node.id, passed ? "if" : "else") ?? nextNodeId(journey.edges, node.id);
      continue;
    }

    pointer = nextNodeId(journey.edges, node.id);
  }

  await db.journeySubscriberState.update({
    where: {
      journeyId_subscriberId: {
        journeyId: journey.id,
        subscriberId,
      },
    },
    data: {
      status: "completed",
      completedAt: new Date(),
      currentNodeId: null,
    },
  });
}

export async function enterJourney(params: {
  journeyId: string;
  subscriberId: string;
  event?: EngineEvent;
}) {
  const journeyRecord = await db.journey.findUnique({
    where: { id: params.journeyId },
  });

  if (!journeyRecord || journeyRecord.status !== "active") {
    return false;
  }

  const nodes = parseJourneyJson(journeyRecord.nodes);
  const edges = parseEdgesJson(journeyRecord.edges);
  const triggerNode = nodes.find((node) => node.type === "trigger");

  if (!triggerNode) {
    return false;
  }

  await db.journeySubscriberState.upsert({
    where: {
      journeyId_subscriberId: {
        journeyId: journeyRecord.id,
        subscriberId: params.subscriberId,
      },
    },
    update: {
      status: "active",
      currentNodeId: triggerNode.id,
      completedAt: null,
    },
    create: {
      journeyId: journeyRecord.id,
      subscriberId: params.subscriberId,
      currentNodeId: triggerNode.id,
      status: "active",
    },
  });

  await processJourney(
    {
      id: journeyRecord.id,
      workspaceId: journeyRecord.workspaceId,
      nodes,
      edges,
    },
    params.subscriberId,
    triggerNode.id,
    params.event
  );

  return true;
}

export async function advanceSubscriberInJourney(params: {
  journeyId: string;
  subscriberId: string;
  startNodeId: string;
}) {
  const journeyRecord = await db.journey.findUnique({
    where: { id: params.journeyId },
  });

  if (!journeyRecord) return;

  await processJourney(
    {
      id: journeyRecord.id,
      workspaceId: journeyRecord.workspaceId,
      nodes: parseJourneyJson(journeyRecord.nodes),
      edges: parseEdgesJson(journeyRecord.edges),
    },
    params.subscriberId,
    params.startNodeId
  );
}

export async function processIncomingEvent(params: {
  workspaceId: string;
  subscriberId?: string;
  type: string;
  properties?: Record<string, unknown>;
}) {
  const event = await db.event.create({
    data: {
      workspaceId: params.workspaceId,
      subscriberId: params.subscriberId,
      type: params.type,
      properties: params.properties ?? {},
    },
  });

  if (!params.subscriberId) {
    return { event, triggeredJourneys: 0 };
  }

  const journeys = await db.journey.findMany({
    where: {
      workspaceId: params.workspaceId,
      status: "active",
    },
  });

  let triggeredJourneys = 0;

  for (const journey of journeys) {
    const trigger = (journey.trigger ?? {}) as Record<string, unknown>;
    if (String(trigger.event) !== params.type) continue;

    const entered = await enterJourney({
      journeyId: journey.id,
      subscriberId: params.subscriberId,
      event: {
        id: event.id,
        type: event.type,
        properties: (event.properties ?? {}) as Record<string, unknown>,
      },
    });

    if (entered) triggeredJourneys += 1;
  }

  return { event, triggeredJourneys };
}
