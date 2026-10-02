import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, NEGOTIATION_PRICE, NEGOTIATION_PRODUCT_NAME } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { negotiation_id, search_id, make, model, year } = body;

  if (!make || !model || !year) {
    return NextResponse.json({ error: "Missing vehicle details" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: NEGOTIATION_PRODUCT_NAME,
            description: `AI negotiation for ${year} ${make} ${model}`,
            images: [],
          },
          unit_amount: NEGOTIATION_PRICE,
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      negotiation_id: negotiation_id ?? "",
      search_id: search_id ?? "",
      make,
      model,
      year: String(year),
    },
    customer_email: user.email,
    success_url: `${appUrl}/negotiate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: negotiation_id
      ? `${appUrl}/negotiate/${negotiation_id}`
      : `${appUrl}/search`,
  });

  return NextResponse.json({ url: session.url });
}
