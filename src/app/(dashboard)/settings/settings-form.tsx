"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WorkspaceValues = {
  name: string;
  timezone: string;
  twilioSid: string | null;
  twilioToken: string | null;
  twilioPhone: string | null;
  resendKey: string | null;
  openaiKey: string | null;
};

export function WorkspaceSettingsForm({ initialValues }: { initialValues: WorkspaceValues }) {
  const [values, setValues] = useState<WorkspaceValues>(initialValues);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const response = await fetch("/api/workspace", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setIsSaving(false);

    if (!response.ok) {
      setStatus("Failed to save workspace settings.");
      return;
    }

    setStatus("Saved.");
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input id="name" value={values.name} onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" value={values.timezone} onChange={(event) => setValues((prev) => ({ ...prev, timezone: event.target.value }))} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="twilioSid">Twilio SID</Label>
          <Input id="twilioSid" value={values.twilioSid ?? ""} onChange={(event) => setValues((prev) => ({ ...prev, twilioSid: event.target.value || null }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twilioPhone">Twilio phone</Label>
          <Input id="twilioPhone" value={values.twilioPhone ?? ""} onChange={(event) => setValues((prev) => ({ ...prev, twilioPhone: event.target.value || null }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="twilioToken">Twilio token</Label>
        <Input id="twilioToken" value={values.twilioToken ?? ""} onChange={(event) => setValues((prev) => ({ ...prev, twilioToken: event.target.value || null }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="resendKey">Resend key</Label>
          <Input id="resendKey" value={values.resendKey ?? ""} onChange={(event) => setValues((prev) => ({ ...prev, resendKey: event.target.value || null }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="openaiKey">OpenAI key</Label>
          <Input id="openaiKey" value={values.openaiKey ?? ""} onChange={(event) => setValues((prev) => ({ ...prev, openaiKey: event.target.value || null }))} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
        {status ? <p className="text-sm text-gray-600">{status}</p> : null}
      </div>
    </form>
  );
}
