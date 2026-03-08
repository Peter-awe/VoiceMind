// ============================================================
// POST /api/stripe/webhook — Handle Stripe webhook events
// Updates Supabase user_profiles on subscription changes
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Map Stripe price IDs → tier (future-proof for multiple tiers)
function resolveTierFromSession(session: Stripe.Checkout.Session): string {
  // Currently only "pro" exists; when adding "starter", add its price ID here
  // const priceId = session.line_items?.data?.[0]?.price?.id;
  // For now, any successful checkout = pro
  return "pro";
}

// Use service role key for admin operations
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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
          const tier = resolveTierFromSession(session);
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
          if (sub.status === "active") {
            await updateUserSubscription(userId, "pro", "active");
          } else if (sub.status === "past_due") {
            // Payment overdue — revoke Pro access until payment resumes
            await updateUserSubscription(userId, "free", "past_due");
          } else {
            await updateUserSubscription(userId, "pro", sub.status);
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
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        const sub = invoice.subscription;
        if (sub && typeof sub === "string") {
          const subscription = await stripe.subscriptions.retrieve(sub);
          const userId = subscription.metadata?.supabase_user_id;
          if (userId) {
            // Payment failed — revoke Pro immediately
            await updateUserSubscription(userId, "free", "past_due");
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Return 500 so Stripe retries the event (up to 3 days)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
