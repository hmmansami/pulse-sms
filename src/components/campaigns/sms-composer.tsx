"use client";

import { useMemo, useRef } from "react";

import { smsSegmentCount } from "@/lib/utils";
import { PhonePreview } from "@/components/campaigns/phone-preview";

const MERGE_TAGS = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{phone}}"];

type SMSComposerProps = {
  value: string;
  onChange: (value: string) => void;
  imageUrl?: string;
  onImageUrlChange: (value: string) => void;
};

export function SMSComposer({ value, onChange, imageUrl, onImageUrlChange }: SMSComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const segments = useMemo(() => smsSegmentCount(value), [value]);
  const charCount = value.length;

  function insertTag(tag: string) {
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}${tag}`);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${tag}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + tag.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  const counterColor = charCount >= 320 ? "text-red-600" : charCount >= 160 ? "text-yellow-600" : "text-gray-600";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-800" htmlFor="sms-body">
          SMS Message
        </label>
        <textarea
          id="sms-body"
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={8}
          placeholder="Write your SMS copy..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
          {MERGE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => insertTag(tag)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className={`text-xs ${counterColor}`}>
          {charCount} characters • {segments} SMS segment{segments === 1 ? "" : "s"}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800" htmlFor="mms-image">
            MMS Image URL (optional)
          </label>
          <input
            id="mms-image"
            type="url"
            value={imageUrl ?? ""}
            onChange={(event) => onImageUrlChange(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-800">Phone Preview</p>
        <PhonePreview body={value} imageUrl={imageUrl} />
      </div>
    </div>
  );
}
