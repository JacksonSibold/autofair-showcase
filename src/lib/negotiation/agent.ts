import OpenAI from "openai";
import type { Negotiation, DealerNegotiation, NegotiationMessage } from "@/types";

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "missing" });
}

const AGENT_SYSTEM_PROMPT = `You are an experienced car buyer's agent negotiating on behalf of a client. You identify yourself clearly as an AI assistant acting for a buyer. Do not imply that you are a human representative.

Key rules:
- Be polite but firm and professional
- Always push for below-market pricing
- Reference specific market data (comps, days on market, competing offers) when available
- Never reveal the client's maximum budget
- Start negotiations at 10-15% below the listed price
- Always ask for the "out the door" price including ALL fees (doc fee, destination, tax, registration)
- Push back on dealer add-ons (nitrogen tires, paint protection, window tint, etc.)
- If the car has been on the lot 30+ days, use that as leverage
- Reference competing dealerships if you have better quotes elsewhere
- For new cars: reference invoice price and holdback as dealer margin room
- Be responsive but don't seem desperate — pace negotiations naturally
- Keep messages concise (2-4 paragraphs max), professional, human-sounding

You are negotiating via email/text on behalf of a buyer who wants to remain anonymous.`;

function buildInitialMessage(
  negotiation: Negotiation,
  dealer: DealerNegotiation & { dealership_name?: string },
  marketData: {
    fair_price: number;
    listed_price?: number;
    days_on_market?: number;
    competing_offer?: number;
  }
): string {
  const vehicle = `${negotiation.target_year} ${negotiation.target_make} ${negotiation.target_model}`;
  const colorStr = negotiation.preferred_color ? ` in ${negotiation.preferred_color}` : "";
  const listed = marketData.listed_price
    ? ` listed at $${marketData.listed_price.toLocaleString()}`
    : "";

  return `Hi,

I'm reaching out on behalf of a buyer who is actively shopping for a ${vehicle}${colorStr}. I noticed you have one available${listed} and wanted to inquire about your best out-the-door price.

My client is a serious buyer ready to move quickly — within the next week or two. They're shopping multiple dealers in the area right now, so competitive pricing will be a key factor in their decision.

Could you provide your best all-in, out-the-door price for the ${vehicle}${colorStr}? This should include the vehicle price, any applicable fees (documentation, destination), taxes, and registration — no surprises at signing.

Looking forward to your response.

Best regards,
Alex
AutoFair Buyer Services`;
}

function buildCounterMessage(
  negotiation: Negotiation,
  dealer: DealerNegotiation & { dealership_name?: string },
  dealerOffer: number,
  marketData: {
    fair_price: number;
    nationwide_avg?: number;
    competing_offer?: number;
    days_on_market?: number;
  },
  round: number
): string {
  const vehicle = `${negotiation.target_year} ${negotiation.target_make} ${negotiation.target_model}`;
  const targetOffer = Math.round(dealerOffer * 0.96); // Push for 4% below their offer

  const domStr =
    marketData.days_on_market && marketData.days_on_market > 30
      ? ` I also notice this vehicle has been available for ${marketData.days_on_market} days, which typically indicates room for negotiation.`
      : "";

  const compStr = marketData.competing_offer
    ? ` I currently have an offer from another dealer at $${marketData.competing_offer.toLocaleString()} OTD on a comparable vehicle.`
    : marketData.nationwide_avg
    ? ` Market data shows similar vehicles averaging $${marketData.nationwide_avg.toLocaleString()} nationwide.`
    : "";

  if (round === 2) {
    return `Thank you for the quote. I appreciate you getting back to me quickly.

Based on my market research, comparable ${vehicle} vehicles are currently selling around $${marketData.fair_price.toLocaleString()} in this region.${compStr}${domStr}

My client's target is $${targetOffer.toLocaleString()} out-the-door. Is that something you could work with? They're ready to move forward quickly if the numbers make sense.

Best,
Alex`;
  }

  return `I've reviewed your offer with my client. We're getting close, but we need to get to $${targetOffer.toLocaleString()} OTD to make this work.${compStr}

My client needs to make a decision by end of this week. What's your absolute best number — no games, just your best price? If you can get there, we can close this quickly.

Best,
Alex`;
}

export async function generateNegotiationMessage(
  negotiation: Negotiation,
  dealerNeg: DealerNegotiation & { dealership_name?: string },
  marketData: {
    fair_price: number;
    listed_price?: number;
    days_on_market?: number;
    competing_offer?: number;
    nationwide_avg?: number;
  }
): Promise<string> {
  const round = dealerNeg.messages.length;

  // For first message, use template (more reliable than LLM for initial outreach)
  if (round === 0) {
    return buildInitialMessage(negotiation, dealerNeg, marketData);
  }

  const lastInbound = [...dealerNeg.messages]
    .reverse()
    .find((m: NegotiationMessage) => m.direction === "inbound");

  if (!lastInbound) {
    return buildCounterMessage(negotiation, dealerNeg, marketData.listed_price ?? marketData.fair_price * 1.05, marketData, 2);
  }

  // Use GPT-4o for nuanced responses to dealer replies
  const messagesForLLM = [
    { role: "system" as const, content: AGENT_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `
Negotiation context:
- Vehicle: ${negotiation.target_year} ${negotiation.target_make} ${negotiation.target_model}
- Fair market price: $${marketData.fair_price.toLocaleString()}
- Listed price: ${marketData.listed_price ? "$" + marketData.listed_price.toLocaleString() : "unknown"}
- Days on market: ${marketData.days_on_market ?? "unknown"}
- Competing offer: ${marketData.competing_offer ? "$" + marketData.competing_offer.toLocaleString() : "none yet"}
- Round: ${round + 1} of negotiation

Recent conversation:
${dealerNeg.messages
  .slice(-6)
  .map((m: NegotiationMessage) => `[${m.direction === "outbound" ? "Alex (us)" : "Dealer"}]: ${m.content}`)
  .join("\n\n")}

Write the next negotiation message from Alex. Keep it under 200 words. Be professional, reference market data, push for a lower price. Do not say you are an AI.`,
    },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: messagesForLLM,
    max_tokens: 400,
    temperature: 0.7,
  });

  return completion.choices[0].message.content ?? buildCounterMessage(negotiation, dealerNeg, dealerNeg.current_offer ?? marketData.fair_price * 1.05, marketData, round);
}

export async function processInboundMessage(
  dealerNegId: string,
  inboundContent: string,
  channel: "email" | "sms"
): Promise<{
  extracted_offer?: number;
  sentiment: "positive" | "neutral" | "negative";
  needs_response: boolean;
}> {
  const prompt = `Analyze this dealer response to a car negotiation:

"${inboundContent}"

Extract:
1. Any dollar amount mentioned as their offer/price (just the number, no $ symbol, 0 if none)
2. Sentiment: positive (willing to deal), neutral, or negative (won't budge/rude)
3. Does this need a response? true/false

Respond with valid JSON only: {"offer": number, "sentiment": "positive"|"neutral"|"negative", "needs_response": boolean}`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0,
    });
    const raw = completion.choices[0].message.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
    return {
      extracted_offer: parsed.offer > 0 ? parsed.offer : undefined,
      sentiment: parsed.sentiment ?? "neutral",
      needs_response: parsed.needs_response ?? true,
    };
  } catch {
    return { sentiment: "neutral", needs_response: true };
  }
}
