import type { SegmentCondition } from "@/types";

type Context = {
  subscriber: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
    tags?: string[];
    customAttrs?: Record<string, unknown> | null;
  };
  event?: {
    type?: string;
    properties?: Record<string, unknown> | null;
  };
};

function getValueByPath(ctx: Context, field: string): unknown {
  const [head, ...rest] = field.split(".");

  const root: Record<string, unknown> = {
    subscriber: {
      firstName: ctx.subscriber.firstName,
      lastName: ctx.subscriber.lastName,
      phone: ctx.subscriber.phone,
      email: ctx.subscriber.email,
      tags: ctx.subscriber.tags ?? [],
      ...(ctx.subscriber.customAttrs ?? {}),
    },
    event: {
      type: ctx.event?.type,
      ...(ctx.event?.properties ?? {}),
    },
  };

  let current: unknown = root[head];

  for (const key of rest) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function evaluateSingleCondition(condition: SegmentCondition, context: Context): boolean {
  const value = getValueByPath(context, condition.field);

  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "not_equals":
      return value !== condition.value;
    case "contains":
      if (Array.isArray(value)) return value.includes(condition.value as never);
      return String(value ?? "").includes(String(condition.value));
    case "gt":
      return Number(value) > Number(condition.value);
    case "lt":
      return Number(value) < Number(condition.value);
    case "gte":
      return Number(value) >= Number(condition.value);
    case "lte":
      return Number(value) <= Number(condition.value);
    case "in":
      return Array.isArray(condition.value)
        ? condition.value.includes(String(value))
        : false;
    case "not_in":
      return Array.isArray(condition.value)
        ? !condition.value.includes(String(value))
        : true;
    case "exists":
      return value !== undefined && value !== null;
    case "not_exists":
      return value === undefined || value === null;
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: SegmentCondition[],
  logic: "and" | "or",
  context: Context
): boolean {
  if (conditions.length === 0) return true;

  if (logic === "or") {
    return conditions.some((condition) => evaluateSingleCondition(condition, context));
  }

  return conditions.every((condition) => evaluateSingleCondition(condition, context));
}
