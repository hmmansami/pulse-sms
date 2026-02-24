import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

type CsvRow = Record<string, string>;

const importSchema = z.object({
  workspaceId: z.string().optional(),
  csv: z.string().min(1, "CSV content is required"),
  mapping: z.record(z.string()).optional().default({}),
  source: z.string().optional().default("import"),
});

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(csv: string): CsvRow[] {
  const rows = csv
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (!rows.length) {
    return [];
  }

  const header = parseCsvLine(rows[0]);

  return rows.slice(1).map((row) => {
    const values = parseCsvLine(row);
    const record: CsvRow = {};

    header.forEach((column, idx) => {
      record[column] = values[idx] ?? "";
    });

    return record;
  });
}

function normalizeNullableString(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ["true", "1", "yes", "y", "subscribed", "active"].includes(normalized);
}

function parseTags(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("|")
    .flatMap((part) => part.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

async function resolveWorkspaceId(request: NextRequest, bodyWorkspaceId?: string): Promise<string | null> {
  const queryWorkspaceId = request.nextUrl.searchParams.get("workspaceId");
  const workspaceId = bodyWorkspaceId ?? queryWorkspaceId;

  if (workspaceId) {
    return workspaceId;
  }

  const firstWorkspace = await db.workspace.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return firstWorkspace?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = importSchema.parse(body);
    const workspaceId = await resolveWorkspaceId(request, parsed.workspaceId);

    if (!workspaceId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    const rows = parseCsv(parsed.csv);
    if (!rows.length) {
      return NextResponse.json<ApiResponse>({ success: false, error: "No CSV rows found" }, { status: 400 });
    }

    let imported = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];

      try {
        const getValue = (targetField: string, fallbacks: string[] = []): string => {
          const mappedColumn = parsed.mapping[targetField];

          if (mappedColumn && row[mappedColumn] !== undefined) {
            return row[mappedColumn];
          }

          for (const fallback of [targetField, ...fallbacks]) {
            if (row[fallback] !== undefined) {
              return row[fallback];
            }
          }

          return "";
        };

        const phone = normalizeNullableString(getValue("phone", ["Phone", "phone_number"]));
        const email = normalizeNullableString(getValue("email", ["Email", "email_address"]));

        if (!phone && !email) {
          throw new Error("Missing phone and email");
        }

        const smsConsent = parseBoolean(getValue("smsConsent", ["sms_consent", "sms_status"]));
        const emailConsent = parseBoolean(getValue("emailConsent", ["email_consent", "email_status"]));
        const now = new Date();

        const subscriberData = {
          workspaceId,
          phone,
          email,
          firstName: normalizeNullableString(getValue("firstName", ["first_name", "First Name"])),
          lastName: normalizeNullableString(getValue("lastName", ["last_name", "Last Name"])),
          smsConsent,
          emailConsent,
          smsOptInAt: smsConsent ? now : null,
          emailOptInAt: emailConsent ? now : null,
          source: parsed.source,
          country: normalizeNullableString(getValue("country", ["Country"])),
          city: normalizeNullableString(getValue("city", ["City"])),
          timezone: normalizeNullableString(getValue("timezone", ["Timezone"])),
          tags: parseTags(getValue("tags", ["Tags"])),
          customAttrs: Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
            const mappedTargets = Object.values(parsed.mapping);
            const reserved = new Set([
              "phone",
              "email",
              "firstName",
              "lastName",
              "smsConsent",
              "emailConsent",
              "country",
              "city",
              "timezone",
              "tags",
              "Phone",
              "Email",
              "first_name",
              "last_name",
              "sms_consent",
              "email_consent",
              "Country",
              "City",
              "Timezone",
              "Tags",
              ...mappedTargets,
            ]);

            if (!reserved.has(key) && value) {
              acc[key] = value;
            }

            return acc;
          }, {}),
        };

        let subscriberId: string;

        if (email) {
          const subscriber = await db.subscriber.upsert({
            where: { workspaceId_email: { workspaceId, email } },
            create: subscriberData,
            update: subscriberData,
            select: { id: true },
          });
          subscriberId = subscriber.id;
        } else if (phone) {
          const subscriber = await db.subscriber.upsert({
            where: { workspaceId_phone: { workspaceId, phone } },
            create: subscriberData,
            update: subscriberData,
            select: { id: true },
          });
          subscriberId = subscriber.id;
        } else {
          throw new Error("Missing phone/email after normalization");
        }

        if (smsConsent || emailConsent) {
          await db.consentLog.createMany({
            data: [
              ...(smsConsent
                ? [
                    {
                      subscriberId,
                      channel: "sms",
                      action: "opt_in",
                      method: "import",
                    },
                  ]
                : []),
              ...(emailConsent
                ? [
                    {
                      subscriberId,
                      channel: "email",
                      action: "opt_in",
                      method: "import",
                    },
                  ]
                : []),
            ],
          });
        }

        imported += 1;
      } catch (error) {
        failed += 1;
        errors.push({ row: rowIndex + 2, error: error instanceof Error ? error.message : "Failed to import row" });
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        imported,
        failed,
        total: rows.length,
        errors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import subscribers";
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}
