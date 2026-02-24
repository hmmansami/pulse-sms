"use client";

import { useState } from "react";
import { DisplayRulesConfigurator } from "@/components/signup-units/display-rules";
import { EmbedCode } from "@/components/signup-units/embed-code";
import { SignupUnitPreview } from "@/components/signup-units/preview";
import { type DisplayRules, type SignupUnitDesign, type SignupUnitType } from "@/types";

export type SignupUnitEditorValue = {
  id?: string;
  workspaceId: string;
  name: string;
  type: SignupUnitType;
  status: "draft" | "active" | "paused";
  design: SignupUnitDesign;
  displayRules: DisplayRules;
  collectEmail: boolean;
  collectSms: boolean;
  offerType: string | null;
  offerValue: string | null;
};

type UnitDesignerProps = {
  mode: "create" | "edit";
  initialValue: SignupUnitEditorValue;
  onSave: (value: SignupUnitEditorValue) => Promise<void>;
};

export function UnitDesigner({ mode, initialValue, onSave }: UnitDesignerProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border bg-white p-4">
          <h2 className="text-lg font-semibold">Sign-up unit designer</h2>

          <label className="block space-y-1 text-sm">
            <span className="text-gray-600">Name</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={value.name}
              onChange={(event) => setValue({ ...value, name: event.target.value })}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-gray-600">Type</span>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={value.type}
                onChange={(event) =>
                  setValue({ ...value, type: event.target.value as SignupUnitType })
                }
              >
                <option value="popup">Popup</option>
                <option value="banner">Banner</option>
                <option value="flyout">Flyout</option>
                <option value="fullscreen">Fullscreen</option>
                <option value="embedded">Embedded</option>
                <option value="landing_page">Landing page</option>
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-gray-600">Status</span>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={value.status}
                onChange={(event) =>
                  setValue({ ...value, status: event.target.value as "draft" | "active" | "paused" })
                }
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-gray-600">Headline</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={value.design.headline}
              onChange={(event) =>
                setValue({ ...value, design: { ...value.design, headline: event.target.value } })
              }
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-gray-600">Subheadline</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={value.design.subheadline ?? ""}
              onChange={(event) =>
                setValue({ ...value, design: { ...value.design, subheadline: event.target.value } })
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Background</span>
              <input
                className="h-10 w-full rounded-md border"
                type="color"
                value={value.design.backgroundColor}
                onChange={(event) =>
                  setValue({
                    ...value,
                    design: { ...value.design, backgroundColor: event.target.value },
                  })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Text</span>
              <input
                className="h-10 w-full rounded-md border"
                type="color"
                value={value.design.textColor}
                onChange={(event) =>
                  setValue({ ...value, design: { ...value.design, textColor: event.target.value } })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">CTA</span>
              <input
                className="h-10 w-full rounded-md border"
                type="color"
                value={value.design.ctaColor}
                onChange={(event) =>
                  setValue({ ...value, design: { ...value.design, ctaColor: event.target.value } })
                }
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-gray-600">CTA Text</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={value.design.ctaText}
              onChange={(event) =>
                setValue({ ...value, design: { ...value.design, ctaText: event.target.value } })
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.collectEmail}
                onChange={(event) => setValue({ ...value, collectEmail: event.target.checked })}
              />
              Collect email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.collectSms}
                onChange={(event) => setValue({ ...value, collectSms: event.target.checked })}
              />
              Collect SMS
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Offer type</span>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={value.offerType ?? "none"}
                onChange={(event) => {
                  const next = event.target.value;
                  setValue({ ...value, offerType: next === "none" ? null : next });
                }}
              >
                <option value="none">None</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
                <option value="freeShipping">Free shipping</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Offer value</span>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={value.offerValue ?? ""}
                placeholder="10% or $15"
                onChange={(event) => setValue({ ...value, offerValue: event.target.value || null })}
              />
            </label>
          </div>
        </section>

        <div className="space-y-4">
          <SignupUnitPreview type={value.type} design={value.design} />
          <EmbedCode workspaceId={value.workspaceId} />
        </div>
      </div>

      <DisplayRulesConfigurator
        value={value.displayRules}
        onChange={(displayRules) => setValue({ ...value, displayRules })}
      />

      <button
        className="rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(value);
          } finally {
            setSaving(false);
          }
        }}
        type="button"
      >
        {saving ? "Saving..." : mode === "create" ? "Create sign-up unit" : "Save changes"}
      </button>
    </div>
  );
}
