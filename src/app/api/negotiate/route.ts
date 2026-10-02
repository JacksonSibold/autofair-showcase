import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { findDealers } from "@/lib/negotiation/dealer-finder";
import { generateNegotiationMessage } from "@/lib/negotiation/agent";
import { sendEmail, generateAliasEmail, buildNegotiationEmailSubject } from "@/lib/communication/email";
import { getPricing } from "@/lib/vehicle-data/pricing-engine";
import type { Negotiation } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { negotiation_id } = await request.json();
  if (!negotiation_id) {
    return NextResponse.json({ error: "negotiation_id required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: neg } = await supabase
    .from("negotiations")
    .select("*")
    .eq("id", negotiation_id)
    .eq("payment_status", "paid")
    .single();

  if (!neg) {
    return NextResponse.json({ error: "Negotiation not found or not paid" }, { status: 404 });
  }

  const negotiation = neg as Negotiation;

  // Update status to contacting_dealers
  await supabase
    .from("negotiations")
    .update({ status: "contacting_dealers" })
    .eq("id", negotiation_id);

  // Step 1: Find dealers
  const dealers = await findDealers({
    make: negotiation.target_make,
    model: negotiation.target_model,
    year: negotiation.target_year,
    user_zip: negotiation.user_zip,
    radius_miles: negotiation.max_drive_miles,
    willing_to_ship: negotiation.willing_to_ship,
  });

  // Step 2: Get market pricing for context
  const pricing = await getPricing({
    make: negotiation.target_make,
    model: negotiation.target_model,
    year: negotiation.target_year,
    condition: "new",
    zip: negotiation.user_zip,
  });

  // Step 3: Upsert dealerships + create dealer_negotiations
  const dealerNegIds: string[] = [];

  for (const dealer of dealers.slice(0, 15)) {
    // Upsert dealership
    const { data: dbDealer } = await supabase
      .from("dealerships")
      .upsert(
        {
          name: dealer.name,
          address: dealer.address,
          city: dealer.city,
          state: dealer.state,
          zip: dealer.zip,
          phone: dealer.phone,
          email: dealer.email,
          website: dealer.website,
          latitude: dealer.latitude,
          longitude: dealer.longitude,
          distance_from_user_miles: dealer.distance_from_user_miles,
        },
        { onConflict: "name,zip" }
      )
      .select("id")
      .single();

    if (!dbDealer) continue;

    const aliasEmail = generateAliasEmail(negotiation_id, dbDealer.id);

    const { data: dealerNeg } = await supabase
      .from("dealer_negotiations")
      .insert({
        negotiation_id,
        dealership_id: dbDealer.id,
        vin: dealer.vin ?? null,
        listing_url: dealer.listing_url ?? null,
        listed_price: dealer.listed_price ?? null,
        contact_method: "email",
        alias_email: aliasEmail,
        status: "pending",
        messages: [],
      })
      .select("id")
      .single();

    if (dealerNeg) dealerNegIds.push(dealerNeg.id);
  }

  // Step 4: Send initial outreach emails
  let contacted = 0;

  for (const dnId of dealerNegIds) {
    const { data: dn } = await supabase
      .from("dealer_negotiations")
      .select("*, dealerships(*)")
      .eq("id", dnId)
      .single();

    if (!dn || !dn.dealerships) continue;

    const dealerEmail = dn.dealerships.email;
    if (!dealerEmail) continue;

    const message = await generateNegotiationMessage(
      negotiation,
      { ...dn, dealership_name: dn.dealerships.name },
      {
        fair_price: pricing.fair_price,
        listed_price: dn.listed_price ?? undefined,
        days_on_market: pricing.days_on_market_avg,
        nationwide_avg: pricing.nationwide_avg,
      }
    );

    const subject = buildNegotiationEmailSubject(
      negotiation.target_make,
      negotiation.target_model,
      negotiation.target_year,
      0
    );

    const { success, message_id } = await sendEmail({
      to: dealerEmail,
      from_alias: dn.alias_email,
      subject,
      body: message,
      negotiation_id,
    });

    if (success) {
      const outboundMsg = {
        id: crypto.randomUUID(),
        direction: "outbound",
        channel: "email",
        content: message,
        timestamp: new Date().toISOString(),
        from: dn.alias_email,
        to: dealerEmail,
        message_id,
      };

      await supabase
        .from("dealer_negotiations")
        .update({
          status: "contacted",
          initial_offer: dn.listed_price,
          messages: [outboundMsg],
        })
        .eq("id", dnId);

      contacted++;
    }

    // Small delay between outreach to avoid spam signals
    await new Promise((r) => setTimeout(r, 500));
  }

  await supabase
    .from("negotiations")
    .update({ status: "negotiating" })
    .eq("id", negotiation_id);

  return NextResponse.json({
    ok: true,
    dealers_found: dealers.length,
    dealers_contacted: contacted,
  });
}
