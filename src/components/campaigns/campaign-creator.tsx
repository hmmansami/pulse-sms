"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AudienceSelector } from "@/components/campaigns/audience-selector";
import { EmailBuilder } from "@/components/campaigns/email-builder";
import { SchedulePicker } from "@/components/campaigns/schedule-picker";
import { SMSComposer } from "@/components/campaigns/sms-composer";
import { EmailBlock } from "@/types";

type SegmentOption = {
  id: string;
  name: string;
  subscriberCount: number;
};

export function CampaignCreator({ segments }: { segments: SegmentOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"sms" | "email">("sms");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [segmentIds, setSegmentIds] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [testTarget, setTestTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const content = useMemo(
    () => ({
      body,
      subject: type === "email" ? subject : undefined,
      imageUrl: type === "sms" ? imageUrl || undefined : undefined,
      blocks: type === "email" ? blocks : undefined,
    }),
    [blocks, body, imageUrl, subject, type],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          content,
          segmentIds,
          scheduledAt: scheduleMode === "later" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.success) {
        throw new Error(createJson.error || "Failed to create campaign");
      }

      const campaignId = createJson.data.id as string;

      if (scheduleMode === "now") {
        await fetch(`/api/campaigns/${campaignId}/send`, { method: "POST" });
      } else if (scheduledAt) {
        await fetch(`/api/campaigns/${campaignId}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: new Date(scheduledAt).toISOString() }),
        });
      }

      router.push(`/campaigns/${campaignId}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendTest() {
    setError(null);
    if (!testTarget) {
      setError("Add a test phone number or email first.");
      return;
    }

    try {
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${name || "Untitled"} (Test)`,
          type,
          content,
          segmentIds: [],
          status: "draft",
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.success) {
        throw new Error(createJson.error || "Failed to create test campaign");
      }

      const campaignId = createJson.data.id as string;

      const testRes = await fetch(`/api/campaigns/${campaignId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTarget }),
      });

      const testJson = await testRes.json();
      if (!testRes.ok || !testJson.success) {
        throw new Error(testJson.error || "Failed to send test");
      }
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Failed to send test");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-lg border bg-white p-4">
        <label className="mb-1 block text-sm font-medium text-gray-800" htmlFor="campaign-name">
          Campaign name
        </label>
        <input
          id="campaign-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Spring launch"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setType("sms")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              type === "sms" ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700"
            }`}
          >
            SMS
          </button>
          <button
            type="button"
            onClick={() => setType("email")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              type === "email" ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700"
            }`}
          >
            Email
          </button>
        </div>
      </div>

      {type === "sms" ? (
        <SMSComposer value={body} onChange={setBody} imageUrl={imageUrl} onImageUrlChange={setImageUrl} />
      ) : (
        <div className="space-y-4 rounded-lg border bg-white p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800" htmlFor="email-subject">
              Subject
            </label>
            <input
              id="email-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Your subject line"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800" htmlFor="email-body">
              Plain text fallback
            </label>
            <textarea
              id="email-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={5}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <EmailBuilder blocks={blocks} onChange={setBlocks} />
        </div>
      )}

      <AudienceSelector segments={segments} selectedSegmentIds={segmentIds} onChange={setSegmentIds} />
      <SchedulePicker
        mode={scheduleMode}
        onModeChange={setScheduleMode}
        scheduledAt={scheduledAt}
        onScheduledAtChange={setScheduledAt}
      />

      <div className="rounded-lg border bg-white p-4">
        <p className="mb-2 text-sm font-medium text-gray-900">Send test message</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={testTarget}
            onChange={(event) => setTestTarget(event.target.value)}
            placeholder={type === "sms" ? "+15555550123" : "test@example.com"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={sendTest}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium"
          >
            Send test
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Saving..." : scheduleMode === "now" ? "Create + send" : "Create + schedule"}
        </button>
      </div>
    </form>
  );
}
