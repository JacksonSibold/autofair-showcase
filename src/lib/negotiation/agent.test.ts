import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DealerNegotiation, Negotiation, NegotiationMessage } from "@/types";

const create = vi.fn();

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create } };
  },
}));

import { generateNegotiationMessage, processInboundMessage } from "./agent";

const negotiation = {
  id: "neg-1",
  target_year: 2024,
  target_make: "Toyota",
  target_model: "RAV4",
  preferred_color: "Blue",
} as unknown as Negotiation;

function dealerNeg(messages: NegotiationMessage[] = []): DealerNegotiation & { dealership_name?: string } {
  return {
    id: "dn-1",
    messages,
    listed_price: 30000,
    dealership_name: "Test Motors",
  } as unknown as DealerNegotiation & { dealership_name?: string };
}

function inbound(content: string): NegotiationMessage {
  return {
    id: "m-in",
    direction: "inbound",
    channel: "email",
    content,
    timestamp: new Date().toISOString(),
  } as unknown as NegotiationMessage;
}

function outbound(content: string): NegotiationMessage {
  return {
    id: "m-out",
    direction: "outbound",
    channel: "email",
    content,
    timestamp: new Date().toISOString(),
  } as unknown as NegotiationMessage;
}

beforeEach(() => {
  create.mockReset();
});

describe("generateNegotiationMessage", () => {
  it("uses the deterministic template for the first outreach without calling the model", async () => {
    const text = await generateNegotiationMessage(negotiation, dealerNeg(), {
      fair_price: 28000,
      listed_price: 30000,
    });

    expect(create).not.toHaveBeenCalled();
    expect(text).toContain("2024 Toyota RAV4 in Blue");
    expect(text).toContain("$30,000");
    expect(text).toContain("out-the-door");
  });

  it("counters at 96% of the dealer's quoted price when no dealer reply is on record", async () => {
    const text = await generateNegotiationMessage(
      negotiation,
      dealerNeg([outbound("initial")]),
      { fair_price: 28000, listed_price: 30000 }
    );

    expect(create).not.toHaveBeenCalled();
    // Round 1 with no inbound: counter uses listed price 30000 -> target 28,800
    expect(text).toContain("$28,800");
  });

  it("asks the model for a reply when there is an inbound dealer message", async () => {
    create.mockResolvedValueOnce({
      choices: [{ message: { content: "Model reply" } }],
    });

    const text = await generateNegotiationMessage(
      negotiation,
      dealerNeg([outbound("initial"), inbound("Best I can do is $29,500")]),
      { fair_price: 28000 }
    );

    expect(create).toHaveBeenCalledTimes(1);
    expect(text).toBe("Model reply");
    const call = create.mock.calls[0][0];
    expect(call.model).toBe("gpt-4o");
    expect(call.messages[1].content).toContain("Fair market price: $28,000");
  });
});

describe("processInboundMessage", () => {
  it("extracts a positive offer and sentiment from the model's JSON reply", async () => {
    create.mockResolvedValueOnce({
      choices: [{ message: { content: '{"offer": 29500, "sentiment": "positive", "needs_response": true}' } }],
    });

    const result = await processInboundMessage("dn-1", "We can do 29500", "sms");

    expect(result).toEqual({
      extracted_offer: 29500,
      sentiment: "positive",
      needs_response: true,
    });
  });

  it("tolerates prose around the JSON object", async () => {
    create.mockResolvedValueOnce({
      choices: [{ message: { content: 'Sure: {"offer": 0, "sentiment": "negative", "needs_response": false} thanks' } }],
    });

    const result = await processInboundMessage("dn-1", "No discount", "email");

    expect(result.extracted_offer).toBeUndefined();
    expect(result.sentiment).toBe("negative");
    expect(result.needs_response).toBe(false);
  });

  it("returns a neutral, response-needed result when the model output is not JSON", async () => {
    create.mockResolvedValueOnce({
      choices: [{ message: { content: "I cannot help with that" } }],
    });

    const result = await processInboundMessage("dn-1", "hello", "email");

    expect(result).toEqual({ sentiment: "neutral", needs_response: true });
  });

  it("returns a neutral fallback when the model call throws", async () => {
    create.mockRejectedValueOnce(new Error("network down"));

    const result = await processInboundMessage("dn-1", "hello", "sms");

    expect(result).toEqual({ sentiment: "neutral", needs_response: true });
  });

  it("includes the inbound channel in the analysis prompt", async () => {
    create.mockResolvedValueOnce({ choices: [{ message: { content: "{}" } }] });

    await processInboundMessage("dn-1", "text body", "sms");

    expect(create.mock.calls[0][0].messages[0].content).toContain("received via sms");
  });
});
