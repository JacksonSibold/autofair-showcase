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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    const supabase = await createServiceClient();

    if (meta.negotiation_id) {
      // Update existing negotiation to paid + active
      await supabase
        .from("negotiations")
        .update({
          payment_status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
          status: "active",
        })
        .eq("id", meta.negotiation_id);
    } else {
      // Create a new negotiation record (preferences will be filled in next step)
      await supabase.from("negotiations").insert({
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
    }
  }

  return NextResponse.json({ received: true });
}
