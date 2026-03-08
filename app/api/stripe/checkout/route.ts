// ============================================================
// POST /api/stripe/checkout — Create a Stripe Checkout Session
// Body: { plan: "plus_monthly" | "plus_yearly" | "pro_monthly" | "pro_yearly" }
// Returns: { url: string } — redirect URL for Stripe Checkout
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { verifyAuth } from "@/lib/server-auth";

// Map plan names to env-based price IDs (keeps IDs server-side only)
const PLAN_PRICES: Record<string, string | undefined> = {
  plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY,
  plus_yearly: process.env.STRIPE_PRICE_PLUS_YEARLY,
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
};

export async function POST(req: NextRequest) {
  try {
    // Verify caller identity — reject unauthenticated requests
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, email } = auth;

    const { plan } = await req.json();

    // Resolve priceId from plan name only (never accept raw price IDs from client)
    const priceId = plan ? PLAN_PRICES[plan] : undefined;

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing plan or priceId" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Find or create customer
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "https://kiwipennotes.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success`,
      cancel_url: `${origin}/#pricing`,
      metadata: {
        supabase_user_id: userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
