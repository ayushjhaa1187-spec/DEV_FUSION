/**
 * /api/webhooks/razorpay/route.ts
 *
 * Aligned with Phase 4/5 Schema:
 * - Table: subscriptions
 * - Table: invoices
 * - RPC: add_credits
 * - Email: sendSubscriptionConfirmationEmail
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServer } from "@/lib/supabase/server";
import { add_credits } from "@/lib/usage"; // Note: this refers to the RPC logic
import { sendSubscriptionConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      return NextResponse.json({ error: "Missing config" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const supabase = await createSupabaseServer();

    // ─── 1. Subscription Success ──────────────────────────────────────────────
    if (event.event === "subscription.charged") {
      const subEntity = event.payload.subscription.entity;
      const payEntity = event.payload.payment.entity;
      
      const subId = subEntity.id;
      const userId = subEntity.notes?.user_id;

      if (!userId) return NextResponse.json({ received: true });

      // Calculate credits based on plan
      let creditsToAdd = 50; 
      let planName = "pro";
      
      // Attempt to map from our razorpay_plan_mapping table
      const { data: mapping } = await supabase
        .from("razorpay_plan_mapping")
        .select("plan_name")
        .eq("razorpay_plan_id", subEntity.plan_id)
        .maybeSingle();

      if (mapping) {
        planName = mapping.plan_name;
        creditsToAdd = planName === "elite" ? 200 : 50;
      }

      // Update Subscriptions Table
      await supabase
        .from("subscriptions")
        .update({ 
            status: "active",
            current_period_start: new Date(subEntity.current_start * 1000).toISOString(),
            current_period_end: new Date(subEntity.current_end * 1000).toISOString()
        })
        .eq("razorpay_subscription_id", subId);

      // Add Credits Atomically (via RPC)
      await supabase.rpc("add_credits", {
          p_user_id: userId,
          p_credits: creditsToAdd
      });

      // Save Invoice
      const { data: invoice } = await supabase
        .from("invoices")
        .insert({
            user_id: userId,
            razorpay_payment_id: payEntity.id,
            amount: payEntity.amount / 100,
            currency: payEntity.currency,
            plan: planName,
            description: `SkillBridge ${planName.toUpperCase()} Subscription Renewal`,
            status: "paid",
            paid_at: new Date().toISOString()
        })
        .select()
        .single();

      // Send Email
      const { data: userProfile } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (userProfile && invoice) {
        await sendSubscriptionConfirmationEmail({
          email: userProfile.email,
          name: userProfile.full_name || "Student",
          plan: planName.toUpperCase(),
          amount: payEntity.amount / 100,
          nextBillingDate: new Date(subEntity.current_end * 1000).toISOString(),
          invoiceId: invoice.id
        });
      }
    } 
    
    // ─── 2. Subscription Cancelled/Halted ─────────────────────────────────────
    else if (event.event === "subscription.halted" || event.event === "subscription.cancelled") {
      const subId = event.payload.subscription.entity.id;
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("razorpay_subscription_id", subId);
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("[razorpay_webhook] Handler Error:", err);
    return NextResponse.json({ error: "Internal processing failed" }, { status: 500 });
  }
}
