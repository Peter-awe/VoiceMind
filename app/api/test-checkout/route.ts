// ============================================================
// TEMPORARY — GET /api/test-checkout
// Creates a 99%-off coupon + checkout session for Pro Max monthly
// Returns the Stripe checkout URL. DELETE after testing!
// ============================================================

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function GET() {
  try {
    const stripe = getStripe();

    // 1. Create a 99%-off coupon (or reuse if exists)
    let couponId: string;
    try {
      const existing = await stripe.coupons.retrieve("TEST_99OFF");
      couponId = existing.id;
    } catch {
      const coupon = await stripe.coupons.create({
        id: "TEST_99OFF",
        percent_off: 99,
        duration: "once",
        name: "Test 99% Off",
      });
      couponId = coupon.id;
    }

    // 2. Get the Pro Max monthly price and rename products to "Pro Max"
    const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
    if (!priceId) {
      return NextResponse.json({ error: "STRIPE_PRICE_PRO_MONTHLY not set" }, { status: 500 });
    }

    // Rename Stripe products from "Pro" → "Pro Max", "Plus" → "Plus"
    const renamedProducts: string[] = [];
    const allPriceIds = [
      process.env.STRIPE_PRICE_PRO_MONTHLY,
      process.env.STRIPE_PRICE_PRO_YEARLY,
      process.env.STRIPE_PRICE_PLUS_MONTHLY,
      process.env.STRIPE_PRICE_PLUS_YEARLY,
    ].filter(Boolean) as string[];

    const seenProducts = new Set<string>();
    for (const pid of allPriceIds) {
      try {
        const price = await stripe.prices.retrieve(pid);
        const productId = typeof price.product === "string" ? price.product : "";
        if (!productId || seenProducts.has(productId)) continue;
        seenProducts.add(productId);

        const product = await stripe.products.retrieve(productId);
        // Rename "KiwiPenNotes Pro" → "KiwiPenNotes Pro Max"
        if (product.name.includes("Pro") && !product.name.includes("Pro Max")) {
          const newName = product.name.replace("Pro", "Pro Max");
          await stripe.products.update(productId, { name: newName });
          renamedProducts.push(`${product.name} → ${newName}`);
        }
      } catch {
        // Skip if price/product not found
      }
    }

    // 3. Create checkout session with the coupon applied
    // Note: discounts and allow_promotion_codes are mutually exclusive in Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      discounts: [{ coupon: couponId }],
      success_url: "https://kiwipennotes.com/settings?payment=success",
      cancel_url: "https://kiwipennotes.com/#pricing",
    });

    return NextResponse.json({
      checkout_url: session.url,
      coupon: couponId,
      price: priceId,
      renamed_products: renamedProducts,
      note: "This is a TEST checkout with 99% off. Delete /api/test-checkout after testing!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
