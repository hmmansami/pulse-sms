"use client";

type SegmentOption = {
  id: string;
  name: string;
  subscriberCount: number;
};

type AudienceSelectorProps = {
  segments: SegmentOption[];
  selectedSegmentIds: string[];
  onChange: (segmentIds: string[]) => void;
};

export function AudienceSelector({ segments, selectedSegmentIds, onChange }: AudienceSelectorProps) {
  function toggle(id: string) {
    if (selectedSegmentIds.includes(id)) {
      onChange(selectedSegmentIds.filter((segmentId) => segmentId !== id));
      return;
    }

    onChange([...selectedSegmentIds, id]);
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="mb-3 text-sm font-medium text-gray-900">Audience Segments</p>
      <div className="space-y-2">
        {segments.map((segment) => (
          <label key={segment.id} className="flex cursor-pointer items-center justify-between rounded border p-2 text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedSegmentIds.includes(segment.id)}
                onChange={() => toggle(segment.id)}
              />
              <span>{segment.name}</span>
            </div>
            <span className="text-xs text-gray-500">{segment.subscriberCount.toLocaleString()} members</span>
          </label>
        ))}
        {segments.length === 0 ? <p className="text-sm text-gray-500">No segments available.</p> : null}
      </div>
    </div>
  );
}
