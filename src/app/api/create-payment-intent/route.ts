import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '../../../../../backend/supabaseAdminClient';
import { getBearerTokenFromRequest, verifySupabaseToken } from '../../../../../backend/supabaseJwtVerifier';

export async function POST(request: Request) {
  try {
    const bearerToken = getBearerTokenFromRequest(request);

    if (!bearerToken) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const payload = await verifySupabaseToken(bearerToken);
    const userId = payload.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token subject' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_paid, full_name')
      .eq('id', userId)
      .single();

    if (profile?.is_paid) {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    // First 1000 paid users are free (no Stripe charge)
    const { count: paidCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_paid', true);

    if ((paidCount ?? 0) < 1000) {
      // Mark as paid and ensure QR token exists
      await supabaseAdmin
        .from('profiles')
        .update({ is_paid: true })
        .eq('id', userId);

      const { data: existingToken } = await supabaseAdmin
        .from('qr_codes')
        .select('token')
        .eq('profile_id', userId)
        .maybeSingle();

      if (!existingToken) {
        const token = Math.random().toString(36).substring(2, 9).toUpperCase();
        await supabaseAdmin
          .from('qr_codes')
          .insert({ profile_id: userId, token });
      }

      return NextResponse.json({ free: true });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 12,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        purpose: 'qr_activation',
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
