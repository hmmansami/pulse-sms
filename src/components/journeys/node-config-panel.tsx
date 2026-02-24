"use client";

import type { JourneyNode } from "@/types";

type NodeConfigPanelProps = {
  node: JourneyNode | null;
  onClose: () => void;
  onChange: (node: JourneyNode) => void;
};

export function NodeConfigPanel({ node, onClose, onChange }: NodeConfigPanelProps) {
  const isOpen = Boolean(node);

  const updateData = (key: string, value: unknown) => {
    if (!node) return;
    onChange({
      ...node,
      data: {
        ...node.data,
        [key]: value,
      },
    });
  };

  return (
    <aside
      className={`absolute right-0 top-0 z-20 h-full w-80 border-l border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Node Configuration</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
        >
          Close
        </button>
      </div>

      {!node ? (
        <p className="text-sm text-slate-500">Select a node to configure it.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Node Type</label>
            <input
              value={node.type}
              readOnly
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
          </div>

          {node.type === "trigger" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Event Type</label>
              <select
                value={String(node.data.event ?? "subscriber_created")}
                onChange={(event) => updateData("event", event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="subscriber_created">subscriber_created</option>
                <option value="cart_abandoned">cart_abandoned</option>
                <option value="product_viewed">product_viewed</option>
                <option value="purchase">purchase</option>
              </select>
            </div>
          )}

          {node.type === "delay" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Delay Amount</label>
                <input
                  type="number"
                  min={0}
                  value={Number(node.data.amount ?? 30)}
                  onChange={(event) => updateData("amount", Number(event.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Unit</label>
                <select
                  value={String(node.data.unit ?? "minutes")}
                  onChange={(event) => updateData("unit", event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
            </>
          )}

          {node.type === "send_sms" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">SMS Message</label>
              <textarea
                rows={6}
                value={String(node.data.body ?? "")}
                onChange={(event) => updateData("body", event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Hi {{first_name}}, your cart is waiting."
              />
            </div>
          )}

          {node.type === "send_email" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Subject</label>
                <input
                  value={String(node.data.subject ?? "")}
                  onChange={(event) => updateData("subject", event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Body</label>
                <textarea
                  rows={6}
                  value={String(node.data.body ?? "")}
                  onChange={(event) => updateData("body", event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {node.type === "condition" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Field</label>
                <input
                  value={String(node.data.field ?? "subscriber.tags")}
                  onChange={(event) => {
                    updateData("field", event.target.value);
                    updateData("conditions", [
                      {
                        field: event.target.value,
                        operator: String(node.data.operator ?? "contains"),
                        value: node.data.value ?? "",
                      },
                    ]);
                  }}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Operator</label>
                <select
                  value={String(node.data.operator ?? "contains")}
                  onChange={(event) => {
                    updateData("operator", event.target.value);
                    updateData("conditions", [
                      {
                        field: String(node.data.field ?? "subscriber.tags"),
                        operator: event.target.value,
                        value: node.data.value ?? "",
                      },
                    ]);
                  }}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not_equals</option>
                  <option value="contains">contains</option>
                  <option value="gt">gt</option>
                  <option value="lt">lt</option>
                  <option value="exists">exists</option>
                  <option value="not_exists">not_exists</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Value</label>
                <input
                  value={String(node.data.value ?? "")}
                  onChange={(event) => {
                    updateData("value", event.target.value);
                    updateData("conditions", [
                      {
                        field: String(node.data.field ?? "subscriber.tags"),
                        operator: String(node.data.operator ?? "contains"),
                        value: event.target.value,
                      },
                    ]);
                  }}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
