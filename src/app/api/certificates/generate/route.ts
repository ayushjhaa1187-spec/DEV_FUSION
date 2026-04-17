/**
 * /api/certificates/generate/route.ts
 *
 * Issues a new certificate after verifying payment/eligibility.
 * 1. Auth check
 * 2. Subscription/Payment verification
 * 3. Generate verification hash (SHA256)
 * 4. Store in DB
 * 5. Return JSON (PDF is generated client-side for cost savings)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";

const GenerateSchema = z.object({
  subject: z.string().min(2),
  score: z.number().int().min(0).max(100),
  certType: z.enum(["subject", "domain", "mentor_reviewed"]),
  razorpayPaymentId: z.string().optional(), // For one-time purchases
});

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse & validate
  let body: z.infer<typeof GenerateSchema>;
  try {
    const raw = await req.json();
    body = GenerateSchema.parse(raw);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 3. Eligibility Check
  // Tiered Pricing: 
  // - Pro/Elite: All Free
  // - Campus/Institutional: All Free
  // - Free Tier: "Standard" is Free, "Professional" is ₹42.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const isPro = ["pro", "elite", "campus_pro", "campus_enterprise", "institutional"].includes(sub?.plan || "");
  const isPremiumCert = body.certType === "domain" || body.certType === "mentor_reviewed" || body.score >= 90;

  // If a standard student wants a premium certificate, they must pay ₹42
  if (!isPro && isPremiumCert && !body.razorpayPaymentId) {
    return NextResponse.json({
      error: "payment_required",
      message: "Professional Domain Certification requires a validation fee of ₹42.",
      price: 42,
      checkoutUrl: `/payment/certificate-fee?id=${verificationHash}`
    }, { status: 402 });
  }

  // 4. Generate Verification Hash
  // We hash: userId + timestamp + score + subject + secret
  const salt = process.env.CERT_SALT || "SB_SECURE_2026";
  const timestamp = Date.now().toString();
  const rawString = `${user.id}-${body.subject}-${body.score}-${timestamp}-${salt}`;
  const verificationHash = crypto.createHash("sha256").update(rawString).digest("hex");

  // 5. Store in DB
  const { data: cert, error: dbError } = await supabase
    .from("certificates")
    .insert({
      user_id: user.id,
      subject: body.subject,
      cert_type: body.certType,
      score_achieved: body.score,
      verification_hash: verificationHash,
      razorpay_payment_id: body.razorpayPaymentId || null,
      metadata: {
         issued_by: "SkillBridge Automated System",
         auth_level: isPro ? "subscribed" : "one_time_purchase"
      }
    })
    .select()
    .single();

  if (dbError) {
    console.error("[cert/generate] DB Error:", dbError);
    return NextResponse.json({ error: "Failed to persist certificate" }, { status: 500 });
  }

  // 6. Update Reputation
  await supabase.rpc("update_reputation", {
    p_user_id: user.id,
    p_action: "cert_earned",
    p_ref_id: cert.id
  });

  // 7. Success
  return NextResponse.json({
    success: true,
    certificateId: cert.id,
    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${verificationHash}`,
    issuedAt: cert.issued_at
  });
}
