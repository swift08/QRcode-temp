import { NextResponse } from 'next/server';
import crypto from 'crypto';
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

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid token subject' }, { status: 400 });
    }

    // Fetch basic profile state for precondition checks
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, mobile_verified')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Activation profile error:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.mobile_verified) {
      return NextResponse.json(
        { error: 'Mobile number must be verified before activation.' },
        { status: 400 }
      );
    }

    // Call the database function that atomically increments the counter,
    // marks the profile as activated, and ensures a QR token exists.
    const { data: activationRows, error: activationError } = await supabaseAdmin
      .rpc('complete_activation', {
        p_profile_id: userId,
      });

    if (activationError || !activationRows || activationRows.length === 0) {
      console.error('complete_activation error:', activationError);
      return NextResponse.json(
        { error: 'Failed to complete activation' },
        { status: 500 }
      );
    }

    const { activation_number, is_free } = activationRows[0] as {
      activation_number: number;
      is_free: boolean;
    };

    // Fetch the QR token to return it to the client
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select('token')
      .eq('profile_id', userId)
      .single();

    if (qrError || !qrCode) {
      console.error('Failed to fetch QR code after activation:', qrError);
      return NextResponse.json(
        { error: 'Activation completed but QR code is missing' },
        { status: 500 }
      );
    }

    // Record payment (including free activations) with idempotency
    const idempotencyKey = `activation-${userId}`;

    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .upsert(
        {
          profile_id: userId,
          amount_paise: is_free ? 0 : 1000,
          currency_code: 'INR',
          provider: 'mock',
          provider_payment_id: crypto.randomUUID(),
          status: 'succeeded',
          is_activation: true,
          idempotency_key: idempotencyKey,
        },
        { onConflict: 'idempotency_key' }
      );

    if (paymentError) {
      console.error('Failed to record activation payment:', paymentError);
      // Do not fail activation for payment logging issues
    }

    return NextResponse.json({
      success: true,
      activationNumber: activation_number,
      isFree: is_free,
      token: qrCode.token,
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'Failed to activate QR' },
      { status: 500 }
    );
  }
}

