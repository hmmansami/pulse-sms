import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { workspaceId: string } }) {
  const unit = await db.signupUnit.findFirst({
    where: { workspaceId: params.workspaceId, status: "active" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      design: true,
      collectEmail: true,
      collectSms: true,
    },
  });

  if (!unit) {
    return new NextResponse("console.info('Pulse embed: no active sign-up units');", {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const design = unit.design as Record<string, string>;
  const html = [
    `<h3 style="margin:0 0 8px;font-size:24px">${design.headline ?? unit.name}</h3>`,
    `<p style="margin:0 0 14px;opacity:.9">${design.subheadline ?? "Sign up for updates."}</p>`,
    unit.collectEmail
      ? '<input id="pulse-email" type="email" placeholder="Email" style="width:100%;padding:10px;border-radius:8px;border:1px solid #d1d5db;margin-bottom:10px" />'
      : "",
    unit.collectSms
      ? '<input id="pulse-phone" type="tel" placeholder="Phone" style="width:100%;padding:10px;border-radius:8px;border:1px solid #d1d5db;margin-bottom:10px" />'
      : "",
    `<button id="pulse-submit" style="width:100%;padding:11px;border:none;border-radius:8px;background:${design.ctaColor ?? "#6366f1"};color:#fff;font-weight:600;cursor:pointer">${design.ctaText ?? "Sign up"}</button>`,
    '<button id="pulse-close" style="margin-top:10px;width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#111827;cursor:pointer">Close</button>',
  ].join("");

  const script = `(() => {
    const modal = document.createElement('div');
    modal.id = 'pulse-signup-unit';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:2147483647';

    const card = document.createElement('div');
    card.style.cssText = 'width:min(92vw,420px);padding:24px;border-radius:14px;background:${design.backgroundColor ?? "#111827"};color:${design.textColor ?? "#ffffff"};font-family:Inter,Arial,sans-serif';
    card.innerHTML = ${JSON.stringify(html)};

    modal.appendChild(card);
    document.body.appendChild(modal);

    fetch('/api/signup-units/${unit.id}/view', { method: 'POST' }).catch(() => undefined);

    card.querySelector('#pulse-close')?.addEventListener('click', () => modal.remove());

    card.querySelector('#pulse-submit')?.addEventListener('click', async () => {
      const email = card.querySelector('#pulse-email')?.value;
      const phone = card.querySelector('#pulse-phone')?.value;
      const response = await fetch('/api/signup-units/${unit.id}/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, source: 'embed' })
      });

      if (response.ok) {
        card.innerHTML = '<h3 style="margin:0 0 10px">Thanks for signing up.</h3><p style="margin:0">Your preferences are saved.</p>';
        setTimeout(() => modal.remove(), 1800);
      }
    });
  })();`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=60",
    },
  });
}
