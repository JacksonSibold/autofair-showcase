import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { processInboundMessage } from "@/lib/negotiation/agent";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // SendGrid inbound parse sends multipart/form-data
  const contentType = request.headers.get("content-type") ?? "";

  let toEmail = "";
  let fromEmail = "";
  let subject = "";
  let body = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    toEmail = String(form.get("to") ?? "");
    fromEmail = String(form.get("from") ?? "");
    subject = String(form.get("subject") ?? "");
    body = String(form.get("text") ?? form.get("html") ?? "");
  } else {
    const json = await request.json().catch(() => ({}));
    toEmail = json.to ?? "";
    fromEmail = json.from ?? "";
    subject = json.subject ?? "";
    body = json.body ?? json.text ?? "";
  }

  if (!toEmail || !body) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createServiceClient();

  // Find dealer_negotiation by alias_email
  const { data: dealerNeg } = await supabase
    .from("dealer_negotiations")
    .select("*, negotiations(*)")
    .eq("alias_email", toEmail.split("<").pop()?.replace(">", "").trim() ?? toEmail)
    .single();

  if (!dealerNeg) {
    return NextResponse.json({ ok: true });
  }

  // Analyze the inbound message
  const analysis = await processInboundMessage(dealerNeg.id, body, "email");

  // Record inbound message
  const newMessage = {
    id: crypto.randomUUID(),
    direction: "inbound",
    channel: "email",
    content: body,
    timestamp: new Date().toISOString(),
    from: fromEmail,
    to: toEmail,
  };

  const messages = [...(dealerNeg.messages ?? []), newMessage];

  // Update dealer negotiation
  const updates: Record<string, unknown> = {
    messages,
    status: "responded",
  };

  if (analysis.extracted_offer) {
    updates.current_offer = analysis.extracted_offer;
    updates.best_offer = Math.min(
      analysis.extracted_offer,
      dealerNeg.best_offer ?? analysis.extracted_offer
    );
    updates.status = "offer_received";

    // Update parent negotiation best offer
    await supabase
      .from("negotiations")
      .update({
        best_offer_amount: Math.min(
          analysis.extracted_offer,
          dealerNeg.negotiations?.best_offer_amount ?? analysis.extracted_offer
        ),
        best_offer_dealer_id: dealerNeg.dealership_id,
        status: "offers_received",
      })
      .eq("id", dealerNeg.negotiation_id);
  }

  await supabase
    .from("dealer_negotiations")
    .update(updates)
    .eq("id", dealerNeg.id);

  // Queue auto-response if needed
  if (analysis.needs_response) {
    await supabase.from("dealer_negotiations").update({
      status: "negotiating",
    }).eq("id", dealerNeg.id);
  }

  return NextResponse.json({ ok: true });
}
