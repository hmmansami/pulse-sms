import { MessageSquareText } from "lucide-react";
import type { JourneyNode } from "@/types";

type SendSMSNodeProps = {
  node: JourneyNode;
  selected: boolean;
  onSelect: () => void;
};

export function SendSMSNode({ node, selected, onSelect }: SendSMSNodeProps) {
  const body = String(node.data.body ?? "Write SMS copy...");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-[220px] rounded-xl border bg-blue-50 p-3 text-left shadow-sm transition ${
        selected ? "ring-2 ring-blue-400" : "border-blue-200"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-blue-700">
        <MessageSquareText className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Send SMS</p>
      </div>
      <p className="line-clamp-2 text-sm font-medium text-blue-900">{body}</p>
    </button>
  );
}
