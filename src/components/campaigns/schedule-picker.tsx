"use client";

type SchedulePickerProps = {
  mode: "now" | "later";
  onModeChange: (mode: "now" | "later") => void;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
};

export function SchedulePicker({ mode, onModeChange, scheduledAt, onScheduledAtChange }: SchedulePickerProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="mb-3 text-sm font-medium text-gray-900">Schedule</p>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={mode === "now"} onChange={() => onModeChange("now")} />
          Send now
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={mode === "later"} onChange={() => onModeChange("later")} />
          Schedule for later
        </label>
        {mode === "later" ? (
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => onScheduledAtChange(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        ) : null}
      </div>
    </div>
  );
}
