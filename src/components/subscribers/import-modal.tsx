"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiResponse } from "@/types";

const targetFields = ["phone", "email", "firstName", "lastName", "smsConsent", "emailConsent", "country", "city", "timezone", "tags"] as const;

type MappingState = Partial<Record<(typeof targetFields)[number], string>>;

function extractHeaders(csv: string): string[] {
  const [headerLine] = csv.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];

  const headers: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < headerLine.length; i += 1) {
    const char = headerLine[i];
    const next = headerLine[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      headers.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  headers.push(current.trim());
  return headers.filter(Boolean);
}

export function ImportModal() {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [mapping, setMapping] = useState<MappingState>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(() => extractHeaders(csv), [csv]);

  const submitImport = async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/subscribers/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv, mapping }),
      });

      const payload: ApiResponse<{
        imported: number;
        failed: number;
        total: number;
        errors: Array<{ row: number; error: string }>;
      }> = await response.json();

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Import failed");
      }

      setResult(`Imported ${payload.data.imported}/${payload.data.total} rows`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Import CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Subscribers</DialogTitle>
          <DialogDescription>Paste CSV data, map columns, and import subscribers in bulk.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">CSV Content</label>
            <textarea
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              className="h-64 w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email,phone,first_name,last_name,sms_consent\nuser@example.com,+15551234567,Casey,Lee,true"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Column Mapping</label>
            <div className="space-y-2 rounded-md border p-3">
              {targetFields.map((field) => (
                <div key={field} className="grid grid-cols-2 items-center gap-2">
                  <span className="text-sm font-medium">{field}</span>
                  <Select
                    value={mapping[field] ?? "skip"}
                    onValueChange={(value) => {
                      setMapping((current) => ({
                        ...current,
                        [field]: value === "skip" ? undefined : value,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={`${field}-${header}`} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {result ? <p className="text-sm text-emerald-600">{result}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={submitImport} disabled={submitting || !csv.trim()}>
            {submitting ? "Importing..." : "Start Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
