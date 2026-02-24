"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewJourneyPage() {
  const router = useRouter();
  const [name, setName] = useState("Welcome Series");
  const [isCreating, setIsCreating] = useState(false);

  const createJourney = async () => {
    setIsCreating(true);

    const response = await fetch("/api/journeys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const payload = (await response.json()) as { data?: { id: string } };

    if (payload.data?.id) {
      router.push(`/journeys/${payload.data.id}`);
      return;
    }

    setIsCreating(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Create Journey</h1>
        <p className="mb-6 text-sm text-slate-600">Start with a name, then design your automation flow on canvas.</p>

        <label className="mb-2 block text-sm font-medium text-slate-700">Journey Name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={createJourney}
          disabled={isCreating}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? "Creating..." : "Create Journey"}
        </button>
      </div>
    </main>
  );
}
