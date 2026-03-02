// ============================================================
// stripe.ts — Stripe helpers for KiwiPenNotes
// Server-side only — used in API routes
// ============================================================

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    _stripe = new Stripe(key, { apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}

// Price IDs — set these after creating products in Stripe Dashboard
// Format: price_xxxx (from Stripe)
export const PRICE_IDS = {
  pro_monthly_usd: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  pro_yearly_usd: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  starter_hourly_usd: process.env.STRIPE_PRICE_STARTER_HOURLY || "",
} as const;
