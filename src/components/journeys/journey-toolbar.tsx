"use client";

import { Activity, PauseCircle, PlayCircle, Save } from "lucide-react";
import type { JourneyStatus } from "@/types";

type JourneyStats = {
  entered?: number;
  active?: number;
  completed?: number;
};

type JourneyToolbarProps = {
  status: JourneyStatus;
  isSaving?: boolean;
  stats?: JourneyStats;
  onSave: () => void;
  onStatusChange: (nextStatus: JourneyStatus) => void;
};

export function JourneyToolbar({
  status,
  isSaving,
  stats,
  onSave,
  onStatusChange,
}: JourneyToolbarProps) {
  const nextStatus: JourneyStatus = status === "active" ? "paused" : "active";

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          Status: {status}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Entered: {stats?.entered ?? 0}
          </span>
          <span>Active: {stats?.active ?? 0}</span>
          <span>Completed: {stats?.completed ?? 0}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStatusChange(nextStatus)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {status === "active" ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
          {status === "active" ? "Pause" : "Activate"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
