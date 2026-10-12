import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Misconfiguration, not a bad request: return 500 so Stripe retries once fixed.
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    const supabase = await createServiceClient();

    if (meta.negotiation_id) {
      // Update existing negotiation to paid + active
      const { error } = await supabase
        .from("negotiations")
        .update({
          payment_status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
          status: "active",
        })
        .eq("id", meta.negotiation_id);
      if (error) {
        // Return 500 so Stripe redelivers the event instead of dropping a paid order.
        console.error("[stripe webhook] failed to mark negotiation paid:", error.message);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    } else {
      // Create a new negotiation record (preferences will be filled in next step)
      const { error } = await supabase.from("negotiations").insert({
        user_id: meta.user_id,
        search_id: meta.search_id || null,
        stripe_payment_intent_id: session.payment_intent as string,
        payment_status: "paid",
        status: "active",
        target_make: meta.make,
        target_model: meta.model,
        target_year: parseInt(meta.year),
        user_zip: "00000", // will be updated in preferences step
        max_drive_miles: 100,
      });
      if (error) {
        console.error("[stripe webhook] failed to create negotiation:", error.message);
        return NextResponse.json({ error: "Database insert failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
