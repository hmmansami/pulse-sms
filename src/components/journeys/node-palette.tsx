"use client";

import { useDraggable } from "@dnd-kit/core";
import type { ComponentType } from "react";
import type { JourneyNodeType } from "@/types";
import { BellRing, Mail, MessageSquareText, SplitSquareVertical, TimerReset } from "lucide-react";

type PaletteItem = {
  type: JourneyNodeType;
  label: string;
  icon: ComponentType<{ className?: string }>;
  className: string;
};

const items: PaletteItem[] = [
  { type: "trigger", label: "Trigger", icon: BellRing, className: "bg-emerald-100 text-emerald-900" },
  { type: "delay", label: "Delay", icon: TimerReset, className: "bg-amber-100 text-amber-900" },
  { type: "send_sms", label: "Send SMS", icon: MessageSquareText, className: "bg-blue-100 text-blue-900" },
  { type: "send_email", label: "Send Email", icon: Mail, className: "bg-violet-100 text-violet-900" },
  { type: "condition", label: "Condition", icon: SplitSquareVertical, className: "bg-yellow-100 text-yellow-900" },
];

function PaletteDraggable({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      kind: "palette",
      nodeType: item.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon = item.icon;

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium transition hover:border-slate-300 ${
        isDragging ? "opacity-60" : "opacity-100"
      } ${item.className}`}
      {...listeners}
      {...attributes}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {item.label}
      </span>
    </button>
  );
}

export function NodePalette() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-900">Node Palette</h3>
      <p className="mb-4 text-xs text-slate-500">Drag nodes onto the canvas.</p>
      <div className="space-y-2">
        {items.map((item) => (
          <PaletteDraggable key={item.type} item={item} />
        ))}
      </div>
    </aside>
  );
}
