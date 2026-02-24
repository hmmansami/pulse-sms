"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SegmentCondition } from "@/types";

type ConditionRowProps = {
  condition: SegmentCondition;
  onChange: (condition: SegmentCondition) => void;
  onRemove: () => void;
};

const fields = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "country", label: "Country" },
  { value: "city", label: "City" },
  { value: "tags", label: "Tags" },
  { value: "status", label: "Status" },
  { value: "smsConsent", label: "SMS Consent" },
  { value: "emailConsent", label: "Email Consent" },
  { value: "event:purchase", label: "Has Purchase Event" },
  { value: "event:click", label: "Has Click Event" },
  { value: "eventCount", label: "Event Count" },
  { value: "custom.loyalty_tier", label: "Custom: loyalty_tier" },
];

const operators: SegmentCondition["operator"][] = ["equals", "not_equals", "contains", "gt", "lt", "gte", "lte", "in", "not_in", "exists", "not_exists"];

export function ConditionRow({ condition, onChange, onRemove }: ConditionRowProps) {
  const hideValue = condition.operator === "exists" || condition.operator === "not_exists";

  return (
    <div className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
      <Select value={condition.field} onValueChange={(value) => onChange({ ...condition, field: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={(value: SegmentCondition["operator"]) => onChange({ ...condition, operator: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((operator) => (
            <SelectItem key={operator} value={operator}>
              {operator}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hideValue ? (
        <div className="flex h-10 items-center rounded-md border border-dashed px-3 text-sm text-muted-foreground">No value required</div>
      ) : (
        <Input
          value={Array.isArray(condition.value) ? condition.value.join(",") : String(condition.value)}
          onChange={(event) => {
            const value = event.target.value;
            if (["in", "not_in"].includes(condition.operator)) {
              onChange({
                ...condition,
                value: value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              });
              return;
            }

            if (["gt", "lt", "gte", "lte"].includes(condition.operator)) {
              onChange({ ...condition, value: Number(value) || 0 });
              return;
            }

            if (["smsConsent", "emailConsent"].includes(condition.field)) {
              onChange({ ...condition, value: ["true", "1", "yes"].includes(value.toLowerCase()) });
              return;
            }

            onChange({ ...condition, value });
          }}
          placeholder="Value"
        />
      )}

      <Button variant="outline" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
