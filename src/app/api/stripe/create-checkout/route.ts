import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, NEGOTIATION_PRICE, NEGOTIATION_PRODUCT_NAME } from "@/lib/stripe";
import { isUuid, parseMakeName, parseModelYear, readJsonBody } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const { negotiation_id, search_id } = body;
  const make = parseMakeName(body.make);
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const year = parseModelYear(body.year);

  if (!make || !model || model.length > 60 || !year) {
    return NextResponse.json({ error: "Missing or invalid vehicle details" }, { status: 400 });
  }
  if (negotiation_id !== undefined && negotiation_id !== null && !isUuid(negotiation_id)) {
    return NextResponse.json({ error: "negotiation_id must be a UUID" }, { status: 400 });
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
      negotiation_id: typeof negotiation_id === "string" ? negotiation_id : "",
      search_id: typeof search_id === "string" ? search_id : "",
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
