"use client";

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    onChange({ from: toIsoDate(start), to: toIsoDate(end) });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
      <div className="space-y-1">
        <p className="text-xs uppercase text-gray-500">From</p>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          type="date"
          value={from}
          onChange={(event) => onChange({ from: event.target.value, to })}
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs uppercase text-gray-500">To</p>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          type="date"
          value={to}
          onChange={(event) => onChange({ from, to: event.target.value })}
        />
      </div>
      <div className="flex gap-2">
        {[7, 30, 90].map((days) => (
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            key={days}
            onClick={() => applyPreset(days)}
            type="button"
          >
            Last {days}d
          </button>
        ))}
      </div>
    </div>
  );
}
