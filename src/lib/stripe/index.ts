import Stripe from "stripe";

export const NEGOTIATION_PRICE = 2000; // $20.00 in cents
export const NEGOTIATION_PRODUCT_NAME = "AutoFair AI Negotiation";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_missing", {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
}

// Named export used by API routes — resolved at call time, not import time
export const stripe = {
  get webhooks() { return getStripe().webhooks; },
  get checkout() { return getStripe().checkout; },
  get paymentIntents() { return getStripe().paymentIntents; },
};
