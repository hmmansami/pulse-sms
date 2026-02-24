"use client";

import { type DisplayRules } from "@/types";

type DisplayRulesProps = {
  value: DisplayRules;
  onChange: (rules: DisplayRules) => void;
};

export function DisplayRulesConfigurator({ value, onChange }: DisplayRulesProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold">Display rules</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Delay (seconds)</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={0}
            value={value.delay}
            onChange={(event) =>
              onChange({ ...value, delay: Number(event.target.value) || 0 })
            }
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Scroll percentage</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={0}
            max={100}
            value={value.scrollPercentage ?? 0}
            onChange={(event) =>
              onChange({ ...value, scrollPercentage: Number(event.target.value) || 0 })
            }
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.exitIntent}
            onChange={(event) => onChange({ ...value, exitIntent: event.target.checked })}
          />
          Enable exit intent
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Frequency cap (days)</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={0}
            value={value.frequencyCap}
            onChange={(event) =>
              onChange({ ...value, frequencyCap: Number(event.target.value) || 0 })
            }
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="text-gray-600">Pages (comma separated, blank means all)</span>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="/, /products/*, /cart"
          value={value.pages.join(",")}
          onChange={(event) =>
            onChange({
              ...value,
              pages: event.target.value
                .split(",")
                .map((page) => page.trim())
                .filter(Boolean),
            })
          }
        />
      </label>

      <div className="space-y-2 text-sm">
        <p className="text-gray-600">Devices</p>
        <div className="flex gap-4">
          {(["desktop", "mobile"] as const).map((device) => {
            const checked = value.devices.includes(device);
            return (
              <label className="flex items-center gap-2" key={device}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    if (event.target.checked) {
                      onChange({ ...value, devices: [...value.devices, device] });
                      return;
                    }
                    onChange({
                      ...value,
                      devices: value.devices.filter((item) => item !== device),
                    });
                  }}
                />
                <span className="capitalize">{device}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
