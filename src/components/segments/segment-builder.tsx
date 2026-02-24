"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConditionRow } from "@/components/segments/condition-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiResponse, SegmentCondition, SegmentRecord, SegmentRules } from "@/types";

const newCondition = (): SegmentCondition => ({
  field: "email",
  operator: "contains",
  value: "",
});

export function SegmentBuilder() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logic, setLogic] = useState<SegmentRules["logic"]>("and");
  const [conditions, setConditions] = useState<SegmentCondition[]>([newCondition()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSegment = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          rules: {
            logic,
            conditions,
          },
        }),
      });

      const payload: ApiResponse<SegmentRecord> = await response.json();

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Failed to create segment");
      }

      router.push(`/segments/${payload.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create segment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Segment</CardTitle>
        <CardDescription>Build dynamic audience rules with AND/OR conditions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Segment name" />
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" />
        </div>

        <div className="max-w-[220px]">
          <Select value={logic} onValueChange={(value: SegmentRules["logic"]) => setLogic(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Logic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">AND (all conditions)</SelectItem>
              <SelectItem value="or">OR (any condition)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <ConditionRow
              key={`${condition.field}-${condition.operator}-${index}`}
              condition={condition}
              onChange={(updatedCondition) => {
                setConditions((current) => current.map((item, conditionIndex) => (conditionIndex === index ? updatedCondition : item)));
              }}
              onRemove={() => {
                setConditions((current) => {
                  if (current.length === 1) {
                    return current;
                  }
                  return current.filter((_, conditionIndex) => conditionIndex !== index);
                });
              }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConditions((current) => [...current, newCondition()])}>
            Add Condition
          </Button>
          <Button onClick={saveSegment} disabled={submitting || !name.trim() || conditions.length === 0}>
            {submitting ? "Saving..." : "Create Segment"}
          </Button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
