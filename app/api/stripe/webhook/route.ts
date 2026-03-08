// ============================================================
// POST /api/stripe/webhook — Handle Stripe webhook events
// Updates Supabase user_profiles on subscription changes
// Supports Plus and Pro tiers via price ID resolution
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Map Stripe price IDs → tier name
function resolveTier(priceId: string | undefined | null): string {
  if (!priceId) return "pro"; // backward compat

  const plusPrices = [
    process.env.STRIPE_PRICE_PLUS_MONTHLY,
    process.env.STRIPE_PRICE_PLUS_YEARLY,
  ].filter(Boolean);

  if (plusPrices.includes(priceId)) return "plus";

  // Everything else (pro monthly/yearly, unknown) → pro
  return "pro";
}

// Extract price ID from a checkout session (needs line_items expansion)
async function resolveTierFromSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<string> {
  try {
    // Retrieve session with line_items expanded
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    const priceId = full.line_items?.data?.[0]?.price?.id;
    return resolveTier(priceId);
  } catch {
    return "pro"; // fallback
  }
}

// Extract price ID from a subscription
function resolveTierFromSubscription(sub: Stripe.Subscription): string {
  const priceId = sub.items?.data?.[0]?.price?.id;
  return resolveTier(priceId);
}

// Use service role key for admin operations
function getAdminSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ggczwqlopjiyuhbnnpgs.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Supabase admin env vars not set");
  return createClient(url, key);
}

async function updateUserSubscription(
  userId: string,
  tier: string,
  status: string,
  stripeCustomerId?: string
) {
  const supabase = getAdminSupabase();
  const updates: Record<string, unknown> = {
    subscription_tier: tier,
    subscription_status: status,
  };
  if (stripeCustomerId) {
    updates.stripe_customer_id = stripeCustomerId;
  }
  await supabase.from("user_profiles").update(updates).eq("id", userId);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (userId) {
          const tier = await resolveTierFromSession(stripe, session);
          await updateUserSubscription(
            userId,
            tier,
            "active",
            session.customer as string
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          const tier = resolveTierFromSubscription(sub);
          if (sub.status === "active") {
            await updateUserSubscription(userId, tier, "active");
          } else if (sub.status === "past_due") {
            await updateUserSubscription(userId, "free", "past_due");
          } else {
            await updateUserSubscription(userId, tier, sub.status);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await updateUserSubscription(userId, "free", "canceled");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | null;
        };
        const sub = invoice.subscription;
        if (sub && typeof sub === "string") {
          const subscription = await stripe.subscriptions.retrieve(sub);
          const userId = subscription.metadata?.supabase_user_id;
          if (userId) {
            await updateUserSubscription(userId, "free", "past_due");
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
