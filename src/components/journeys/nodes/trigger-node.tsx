import { BellRing } from "lucide-react";
import type { JourneyNode } from "@/types";

type TriggerNodeProps = {
  node: JourneyNode;
  selected: boolean;
  onSelect: () => void;
};

export function TriggerNode({ node, selected, onSelect }: TriggerNodeProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-[220px] rounded-xl border bg-emerald-50 p-3 text-left shadow-sm transition ${
        selected ? "ring-2 ring-emerald-400" : "border-emerald-200"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-emerald-700">
        <BellRing className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Trigger</p>
      </div>
      <p className="text-sm font-medium text-emerald-900">{String(node.data.event ?? "subscriber_created")}</p>
    </button>
  );
}
