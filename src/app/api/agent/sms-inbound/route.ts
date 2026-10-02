import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { processInboundMessage } from "@/lib/negotiation/agent";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const to = String(form.get("To") ?? "");
  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "");

  if (!to || !body) {
    return new NextResponse("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const supabase = await createServiceClient();

  // Find dealer_negotiation by alias_phone
  const { data: dealerNeg } = await supabase
    .from("dealer_negotiations")
    .select("*, negotiations(*)")
    .eq("alias_phone", to)
    .single();

  if (dealerNeg) {
    const analysis = await processInboundMessage(dealerNeg.id, body, "sms");

    const newMessage = {
      id: crypto.randomUUID(),
      direction: "inbound",
      channel: "sms",
      content: body,
      timestamp: new Date().toISOString(),
      from,
      to,
    };

    const messages = [...(dealerNeg.messages ?? []), newMessage];
    const updates: Record<string, unknown> = { messages, status: "responded" };

    if (analysis.extracted_offer) {
      updates.current_offer = analysis.extracted_offer;
      updates.best_offer = Math.min(
        analysis.extracted_offer,
        dealerNeg.best_offer ?? analysis.extracted_offer
      );
      updates.status = "offer_received";
    }

    await supabase.from("dealer_negotiations").update(updates).eq("id", dealerNeg.id);
  }

  return new NextResponse("<?xml version='1.0'?><Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
