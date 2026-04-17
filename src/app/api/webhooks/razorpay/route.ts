import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// We use the Service Role key here because Webhooks aren't authenticated as the user
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      console.error('[razorpay_webhook] Missing secret or signature');
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    // 1. Verify Signature to prevent spoofing
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[razorpay_webhook] Invalid signature detected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventId = event.id || event.payload.payment?.entity?.id || event.payload.order?.entity?.id;
    console.log(`[razorpay_webhook] Received event: ${event.event} (ID: ${eventId})`);

    // 2. Idempotency Check
    if (eventId) {
      const { data: alreadyProcessed } = await supabaseAdmin
        .from('processed_webhooks')
        .select('id')
        .eq('id', eventId)
        .maybeSingle();
      
      if (alreadyProcessed) {
        console.log(`[razorpay_webhook] Event ${eventId} already processed. Skipping.`);
        return NextResponse.json({ status: 'already_processed' });
      }
    }

    // 3. Handle successful payment
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment?.entity || event.payload.order?.entity;
      const notes = payment?.notes || {};
      const { userId, planType } = notes;

      if (!userId || !planType) {
        console.warn('[razorpay_webhook] Missing metadata in payment notes', { userId, planType });
        return NextResponse.json({ status: 'ignored_missing_metadata' });
      }

      // Record this webhook as processed immediately (atomic-ish)
      if (eventId) {
        await supabaseAdmin.from('processed_webhooks').insert({
          id: eventId,
          provider: 'razorpay',
          event_type: event.event,
          payload: event
        });
      }

      console.log(`[razorpay_webhook] Processing ${planType} for user ${userId}`);

      if (planType === 'pro' || planType === 'elite') {
        // Upgrade User Subscription in Database
        const { error: subError } = await supabaseAdmin
          .from('subscriptions')
          .upsert({ 
             user_id: userId, 
             plan: planType, 
             status: 'active',
             razorpay_subscription_id: payment.id,
             updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
          
        if (subError) throw subError;
        
        // Also update the profile role if needed
        await supabaseAdmin
          .from('profiles')
          .update({ role: planType === 'elite' ? 'mentor' : 'student' }) // Optional heuristic
          .eq('id', userId);

      } 
      else if (planType === 'credit_pack') {
        // Top up Credit Wallet (Atomic increase)
        // Note: Using an RPC would be safer, but for this flow we use basic update
        const { data: wallet, error: walletError } = await supabaseAdmin
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (walletError && walletError.code !== 'PGRST116') throw walletError;

        const currentBalance = wallet?.balance || 0;
        const { error: upsertError } = await supabaseAdmin
          .from('wallets')
          .upsert({ 
            user_id: userId, 
            balance: currentBalance + 50,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
          
        if (upsertError) throw upsertError;
      }
      
      // Log the transaction in invoices
      await supabaseAdmin.from('invoices').insert({
        user_id: userId,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: 'paid',
        plan: planType,
        provider: 'razorpay',
        platform_id: payment.id
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
