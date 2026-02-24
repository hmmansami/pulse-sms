"use client";

import { useMemo, useState } from "react";

type EmbedCodeProps = {
  workspaceId: string;
};

export function EmbedCode({ workspaceId }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(
    () => `<script>
  (function(w,d,s,u){
    var js=d.createElement(s);js.async=true;js.src=u;
    d.head.appendChild(js);
  })(window,document,'script','${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/embed/${workspaceId}');
</script>`,
    [workspaceId]
  );

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold">Embed code</h3>
      <pre className="overflow-x-auto rounded-md bg-gray-950 p-3 font-mono text-xs text-green-300">
        {snippet}
      </pre>
      <button
        className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        onClick={async () => {
          await navigator.clipboard.writeText(snippet);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        type="button"
      >
        {copied ? "Copied" : "Copy snippet"}
      </button>
    </div>
  );
}
