import { SplitSquareVertical } from "lucide-react";
import type { JourneyNode } from "@/types";

type ConditionNodeProps = {
  node: JourneyNode;
  selected: boolean;
  onSelect: () => void;
};

export function ConditionNode({ node, selected, onSelect }: ConditionNodeProps) {
  const field = String(node.data.field ?? "subscriber.tags");
  const operator = String(node.data.operator ?? "contains");
  const value = String(node.data.value ?? "vip");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-[220px] rounded-xl border bg-yellow-50 p-3 text-left shadow-sm transition ${
        selected ? "ring-2 ring-yellow-400" : "border-yellow-200"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-yellow-700">
        <SplitSquareVertical className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Condition</p>
      </div>
      <p className="line-clamp-2 text-sm font-medium text-yellow-900">
        {field} {operator} {value}
      </p>
    </button>
  );
}
