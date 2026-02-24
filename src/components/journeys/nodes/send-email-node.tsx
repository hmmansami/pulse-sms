import { Mail } from "lucide-react";
import type { JourneyNode } from "@/types";

type SendEmailNodeProps = {
  node: JourneyNode;
  selected: boolean;
  onSelect: () => void;
};

export function SendEmailNode({ node, selected, onSelect }: SendEmailNodeProps) {
  const subject = String(node.data.subject ?? "Email subject");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-[220px] rounded-xl border bg-violet-50 p-3 text-left shadow-sm transition ${
        selected ? "ring-2 ring-violet-400" : "border-violet-200"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-violet-700">
        <Mail className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Send Email</p>
      </div>
      <p className="line-clamp-2 text-sm font-medium text-violet-900">{subject}</p>
    </button>
  );
}
