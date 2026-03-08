// ============================================================
// TEMPORARY DEBUG — GET /api/debug-checkout
// Tests Stripe checkout session creation WITHOUT auth
// DELETE THIS FILE after debugging is done!
// ============================================================

import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  const addStep = (name: string, data: unknown) => {
    (results.steps as unknown[]).push({ name, ...((data && typeof data === "object") ? data : { value: data }) });
  };

  try {
    // Step 1: Check env vars
    const priceId = process.env.STRIPE_PRICE_PLUS_MONTHLY;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    addStep("env_check", {
      STRIPE_SECRET_KEY: stripeKey ? `set (${stripeKey.substring(0, 7)}...)` : "NOT SET",
      STRIPE_PRICE_PLUS_MONTHLY: priceId || "NOT SET",
      STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || "NOT SET",
    });

    if (!stripeKey || !priceId) {
      results.error = "Missing env vars";
      return NextResponse.json(results);
    }

    // Step 2: Import and init Stripe
    const { default: Stripe } = await import("stripe");
    addStep("stripe_import", { ok: true });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
      httpClient: Stripe.createFetchHttpClient(),
    });
    addStep("stripe_init", { ok: true });

    // Step 3: Verify the price exists
    try {
      const price = await stripe.prices.retrieve(priceId);
      addStep("price_retrieve", {
        id: price.id,
        active: price.active,
        currency: price.currency,
        unit_amount: price.unit_amount,
        product: price.product,
        type: price.type,
        recurring: price.recurring,
      });
    } catch (err: unknown) {
      addStep("price_retrieve", {
        error: err instanceof Error ? err.message : String(err),
      });
      results.error = "Price ID invalid or inaccessible";
      return NextResponse.json(results);
    }

    // Step 4: Try to find/create a test customer
    try {
      const customers = await stripe.customers.list({
        email: "debug-test@kiwipennotes.com",
        limit: 1,
      });
      addStep("customer_list", {
        found: customers.data.length,
      });
    } catch (err: unknown) {
      addStep("customer_list", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Step 5: Try creating a checkout session (with a dummy customer)
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: "https://kiwipennotes.com/settings?payment=success",
        cancel_url: "https://kiwipennotes.com/#pricing",
        // Don't pass customer — just test if session creation works
      });
      addStep("checkout_create", {
        id: session.id,
        url: session.url ? `${session.url.substring(0, 60)}...` : "NULL",
        status: session.status,
      });
      results.success = true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addStep("checkout_create", { error: message });
      results.error = `Checkout session creation failed: ${message}`;
    }
  } catch (err: unknown) {
    results.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
