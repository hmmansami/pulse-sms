"use client";

import { type SignupUnitDesign, type SignupUnitType } from "@/types";

type UnitPreviewProps = {
  type: SignupUnitType;
  design: SignupUnitDesign;
};

function UnitCard({ design }: { design: SignupUnitDesign }) {
  return (
    <div
      className="mx-auto w-full max-w-sm rounded-xl border p-6 shadow-sm"
      style={{
        background: design.backgroundColor,
        color: design.textColor,
      }}
    >
      <h4 className="text-xl font-semibold">{design.headline}</h4>
      {design.subheadline ? <p className="mt-2 text-sm opacity-90">{design.subheadline}</p> : null}
      <div className="mt-4 space-y-2">
        {design.fields.includes("email") ? <input className="w-full rounded-md border bg-white px-3 py-2 text-black" placeholder="Email" /> : null}
        {design.fields.includes("phone") ? <input className="w-full rounded-md border bg-white px-3 py-2 text-black" placeholder="Phone" /> : null}
      </div>
      <button
        className="mt-4 w-full rounded-md px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: design.ctaColor }}
        type="button"
      >
        {design.ctaText}
      </button>
    </div>
  );
}

export function SignupUnitPreview({ type, design }: UnitPreviewProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold">Preview</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-gray-100 p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-500">Desktop</p>
          <div className="rounded-xl border bg-white p-4">
            <p className="mb-4 text-xs text-gray-500">Type: {type}</p>
            <UnitCard design={design} />
          </div>
        </div>
        <div className="rounded-xl border bg-gray-100 p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-500">Mobile</p>
          <div className="mx-auto max-w-[240px] rounded-[28px] border-4 border-gray-800 bg-white p-3">
            <div className="h-[430px] overflow-hidden rounded-[20px] border bg-gray-50 p-3">
              <p className="mb-3 text-center text-[10px] text-gray-400">{type} mockup</p>
              <UnitCard design={design} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
