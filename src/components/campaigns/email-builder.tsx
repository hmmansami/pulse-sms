"use client";

import { EmailBlock } from "@/types";

type EmailBuilderProps = {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
};

const BLOCK_TYPES: Array<EmailBlock["type"]> = ["text", "image", "button", "divider"];

function createBlock(type: EmailBlock["type"]): EmailBlock {
  return {
    id: crypto.randomUUID(),
    type,
    content:
      type === "text"
        ? { text: "Write your content..." }
        : type === "image"
          ? { src: "", alt: "" }
          : type === "button"
            ? { label: "Shop now", href: "https://" }
            : { style: "solid" },
  };
}

export function EmailBuilder({ blocks, onChange }: EmailBuilderProps) {
  function updateBlock(id: string, content: Record<string, unknown>) {
    onChange(blocks.map((block) => (block.id === id ? { ...block, content } : block)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((block) => block.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange([...blocks, createBlock(type)])}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Add {type}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.id} className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium capitalize text-gray-800">{block.type} block</p>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            {block.type === "text" ? (
              <textarea
                value={String(block.content.text ?? "")}
                onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            ) : null}

            {block.type === "image" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="url"
                  value={String(block.content.src ?? "")}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block.content,
                      src: event.target.value,
                    })
                  }
                  placeholder="Image URL"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={String(block.content.alt ?? "")}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block.content,
                      alt: event.target.value,
                    })
                  }
                  placeholder="Alt text"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            ) : null}

            {block.type === "button" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={String(block.content.label ?? "")}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block.content,
                      label: event.target.value,
                    })
                  }
                  placeholder="Button label"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="url"
                  value={String(block.content.href ?? "")}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block.content,
                      href: event.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            ) : null}

            {block.type === "divider" ? (
              <div className="h-2 rounded bg-gray-100" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
