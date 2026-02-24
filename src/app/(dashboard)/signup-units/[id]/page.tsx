"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UnitDesigner, type SignupUnitEditorValue } from "@/components/signup-units/unit-designer";

export default function EditSignupUnitPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [unit, setUnit] = useState<SignupUnitEditorValue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const response = await fetch(`/api/signup-units/${params.id}`);
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as { data: SignupUnitEditorValue };
      if (mounted) {
        setUnit(payload.data);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) {
    return <main className="p-6 text-sm text-gray-500">Loading sign-up unit...</main>;
  }

  if (!unit) {
    return <main className="p-6 text-sm text-red-600">Sign-up unit not found.</main>;
  }

  return (
    <main className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit sign-up unit</h1>
        <button
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          onClick={async () => {
            if (!confirm("Delete this unit?")) return;
            const response = await fetch(`/api/signup-units/${params.id}`, { method: "DELETE" });
            if (response.ok) router.push("/signup-units");
          }}
          type="button"
        >
          Delete
        </button>
      </div>

      <UnitDesigner
        initialValue={unit}
        mode="edit"
        onSave={async (value) => {
          const response = await fetch(`/api/signup-units/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(value),
          });
          if (!response.ok) {
            alert("Failed to save sign-up unit");
            return;
          }
          alert("Saved");
        }}
      />
    </main>
  );
}
