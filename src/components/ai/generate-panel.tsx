"use client";

import { useState } from "react";

type GeneratePanelProps = {
  open: boolean;
  workspaceId?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function GeneratePanel({ open, workspaceId, onClose, onSelect }: GeneratePanelProps) {
  const [product, setProduct] = useState("");
  const [offer, setOffer] = useState("");
  const [goal, setGoal] = useState("Drive purchases");
  const [tone, setTone] = useState("Playful and direct");
  const [audience, setAudience] = useState("Mobile shoppers");
  const [mustInclude, setMustInclude] = useState("Free shipping");
  const [avoid, setAvoid] = useState("spammy urgency");
  const [smsVariants, setSmsVariants] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const brandVoice = { tone, audience, mustInclude, avoid };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l bg-white p-5 shadow-2xl transition-transform duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI content assistant</h2>
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={onClose} type="button">
          Close
        </button>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Product"
          value={product}
          onChange={(event) => setProduct(event.target.value)}
        />
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Offer"
          value={offer}
          onChange={(event) => setOffer(event.target.value)}
        />
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Campaign goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />

        <div className="grid gap-2 rounded-lg border bg-gray-50 p-3 md:grid-cols-2">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Tone"
            value={tone}
            onChange={(event) => setTone(event.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Must include"
            value={mustInclude}
            onChange={(event) => setMustInclude(event.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Avoid"
            value={avoid}
            onChange={(event) => setAvoid(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
            disabled={loading || !product || !offer}
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch("/api/ai/generate-sms", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ product, offer, goal, workspaceId, brandVoice }),
                });
                const payload = (await response.json()) as { data?: string[] };
                setSmsVariants(payload.data ?? []);
              } finally {
                setLoading(false);
              }
            }}
            type="button"
          >
            Generate SMS variants
          </button>

          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || !product || !offer}
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch("/api/ai/generate-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ product, offer, audience, workspaceId, brandVoice }),
                });
                const payload = (await response.json()) as { data?: string[] };
                setSubjects(payload.data ?? []);
              } finally {
                setLoading(false);
              }
            }}
            type="button"
          >
            Generate email subjects
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4 overflow-y-auto">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">SMS variants</h3>
          {smsVariants.map((item) => (
            <button
              className="block w-full rounded-lg border p-3 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
              key={item}
              onClick={() => onSelect(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Email subject lines</h3>
          {subjects.map((item) => (
            <button
              className="block w-full rounded-lg border p-3 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
              key={item}
              onClick={() => onSelect(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </section>
      </div>
    </aside>
  );
}
