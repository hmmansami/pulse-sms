"use client";

import { useRouter } from "next/navigation";
import { UnitDesigner, type SignupUnitEditorValue } from "@/components/signup-units/unit-designer";

const defaultUnit: SignupUnitEditorValue = {
  workspaceId: "",
  name: "New popup",
  type: "popup",
  status: "draft",
  design: {
    headline: "Get 10% off your first order",
    subheadline: "Sign up for SMS and email updates.",
    ctaText: "Claim offer",
    backgroundColor: "#111827",
    textColor: "#ffffff",
    ctaColor: "#6366F1",
    fields: ["email", "phone"],
  },
  displayRules: {
    delay: 5,
    scrollPercentage: 40,
    exitIntent: true,
    pages: [],
    devices: ["desktop", "mobile"],
    frequencyCap: 7,
  },
  collectEmail: true,
  collectSms: true,
  offerType: "percentage",
  offerValue: "10",
};

export default function NewSignupUnitPage() {
  const router = useRouter();

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">New sign-up unit</h1>
      <UnitDesigner
        initialValue={defaultUnit}
        mode="create"
        onSave={async (value) => {
          const response = await fetch("/api/signup-units", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(value),
          });

          if (!response.ok) {
            alert("Failed to create sign-up unit");
            return;
          }

          const payload = (await response.json()) as { data?: { id: string } };
          router.push(`/signup-units/${payload.data?.id ?? ""}`);
        }}
      />
    </main>
  );
}
