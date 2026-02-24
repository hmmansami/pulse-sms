import { TimerReset } from "lucide-react";
import type { JourneyNode } from "@/types";

type DelayNodeProps = {
  node: JourneyNode;
  selected: boolean;
  onSelect: () => void;
};

export function DelayNode({ node, selected, onSelect }: DelayNodeProps) {
  const amount = Number(node.data.amount ?? 30);
  const unit = String(node.data.unit ?? "minutes");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-[220px] rounded-xl border bg-amber-50 p-3 text-left shadow-sm transition ${
        selected ? "ring-2 ring-amber-400" : "border-amber-200"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-amber-700">
        <TimerReset className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Delay</p>
      </div>
      <p className="text-sm font-medium text-amber-900">
        Wait {amount} {unit}
      </p>
    </button>
  );
}
