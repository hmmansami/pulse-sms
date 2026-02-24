import type { SegmentCondition, SegmentRules, SubscriberRecord, SubscriberStatus } from "@/types";

type SubscriberForEvaluation = SubscriberRecord & {
  events?: Array<{
    type: string;
    createdAt: string;
    properties?: Record<string, unknown> | null;
  }>;
};

function getCustomAttribute(subscriber: SubscriberForEvaluation, field: string): unknown {
  const normalized = field.replace(/^customAttrs\./, "").replace(/^custom\./, "");
  return subscriber.customAttrs?.[normalized];
}

function getFieldValue(subscriber: SubscriberForEvaluation, field: string): unknown {
  if (field === "status") {
    const status: SubscriberStatus = subscriber.smsConsent ? "active" : "unsubscribed";
    return status;
  }

  if (field.startsWith("custom.") || field.startsWith("customAttrs.")) {
    return getCustomAttribute(subscriber, field);
  }

  if (field === "eventCount") {
    return subscriber.events?.length ?? 0;
  }

  if (field.startsWith("event:")) {
    const eventType = field.replace("event:", "").trim();
    return (subscriber.events ?? []).some((event) => event.type === eventType);
  }

  const value = (subscriber as Record<string, unknown>)[field];
  return value;
}

function toComparable(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value).toLowerCase();
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).toLowerCase());
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [String(value).toLowerCase()];
}

function evaluateCondition(subscriber: SubscriberForEvaluation, condition: SegmentCondition): boolean {
  const fieldValue = getFieldValue(subscriber, condition.field);
  const conditionValue = condition.value;

  switch (condition.operator) {
    case "exists":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
    case "not_exists":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";
    case "equals": {
      const lhs = toComparable(fieldValue);
      const rhs = toComparable(conditionValue);
      return lhs === rhs;
    }
    case "not_equals": {
      const lhs = toComparable(fieldValue);
      const rhs = toComparable(conditionValue);
      return lhs !== rhs;
    }
    case "contains": {
      if (Array.isArray(fieldValue)) {
        const value = String(conditionValue).toLowerCase();
        return fieldValue.map((item) => String(item).toLowerCase()).includes(value);
      }

      if (typeof fieldValue === "string") {
        return fieldValue.toLowerCase().includes(String(conditionValue).toLowerCase());
      }

      return false;
    }
    case "in": {
      const list = asArray(conditionValue);
      const lhs = toComparable(fieldValue);
      return lhs !== null && list.includes(String(lhs).toLowerCase());
    }
    case "not_in": {
      const list = asArray(conditionValue);
      const lhs = toComparable(fieldValue);
      return lhs === null || !list.includes(String(lhs).toLowerCase());
    }
    case "gt":
      return Number(fieldValue) > Number(conditionValue);
    case "lt":
      return Number(fieldValue) < Number(conditionValue);
    case "gte":
      return Number(fieldValue) >= Number(conditionValue);
    case "lte":
      return Number(fieldValue) <= Number(conditionValue);
    default:
      return false;
  }
}

export function matchesSegmentRules(subscriber: SubscriberForEvaluation, rules: SegmentRules): boolean {
  if (!rules.conditions.length) {
    return true;
  }

  const evaluations = rules.conditions.map((condition) => evaluateCondition(subscriber, condition));
  if (rules.logic === "or") {
    return evaluations.some(Boolean);
  }

  return evaluations.every(Boolean);
}

export function evaluateSegment(subscribers: SubscriberForEvaluation[], rules: SegmentRules): SubscriberForEvaluation[] {
  return subscribers.filter((subscriber) => matchesSegmentRules(subscriber, rules));
}
