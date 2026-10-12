import crypto from "crypto";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "negotiate@autofair.com";
const FROM_NAME = "Alex @ AutoFair";

export function generateAliasEmail(negotiationId: string, dealershipId: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${negotiationId}-${dealershipId}-${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)}`)
    .digest("hex")
    .slice(0, 10);

  const domain = FROM_EMAIL.split("@")[1] ?? "autofair.com";
  return `buyer-${hash}@${domain}`;
}

export async function sendEmail(params: {
  to: string;
  from_alias: string;
  subject: string;
  body: string;
  negotiation_id: string;
}): Promise<{ success: boolean; message_id?: string }> {
  if (!SENDGRID_API_KEY || SENDGRID_API_KEY.startsWith("REPLACE")) {
    console.log(`[EMAIL MOCK] To: ${params.to}\nSubject: ${params.subject}\n\n${params.body}`);
    return { success: true, message_id: `mock-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: params.from_alias, name: FROM_NAME },
        reply_to: { email: params.from_alias, name: FROM_NAME },
        subject: params.subject,
        content: [{ type: "text/plain", value: params.body }],
        custom_args: { negotiation_id: params.negotiation_id },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("SendGrid error:", err);
      return { success: false };
    }

    const messageId = res.headers.get("X-Message-Id") ?? `sg-${Date.now()}`;
    return { success: true, message_id: messageId };
  } catch (e) {
    console.error("Email send failed:", e);
    return { success: false };
  }
}

export function buildNegotiationEmailSubject(
  make: string,
  model: string,
  year: number,
  round: number
): string {
  const subjects = [
    `Inquiry: ${year} ${make} ${model} — Pricing Request`,
    `Re: ${year} ${make} ${model} — Counter Offer`,
    `Re: ${year} ${make} ${model} — Final Decision This Week`,
    `Re: ${year} ${make} ${model} — Best & Final?`,
  ];
  return subjects[Math.min(round, subjects.length - 1)];
}

/**
 * Extracts the bare address from an RFC 5322-style value such as
 * `"Dealer Sales" <buyer-abc@autofair.com>`. Plain addresses pass through.
 */
export function extractEmailAddress(raw: string): string {
  const angle = raw.match(/<([^<>]+)>/);
  return (angle ? angle[1] : raw).trim();
}
