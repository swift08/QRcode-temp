import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../backend/supabaseAdminClient';
import {
  getBearerTokenFromRequest,
  verifySupabaseToken,
} from '../../../../backend/supabaseJwtVerifier';
import { uploadQrPngToBucket } from '../../../../backend/qrBucketUploader';

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

    // NOTE: Mobile verification check temporarily disabled.
    // Previously we enforced `mobile_verified = true` before activation.

    // Call the database function that atomically increments the counter,
    // marks the profile as activated, and ensures a QR token exists.
    const { data: activationRows, error: activationError } = await supabaseAdmin
      .rpc('complete_activation', {
        p_profile_id: userId,
      });

    if (activationError || !activationRows || activationRows.length === 0) {
      console.error('complete_activation error:', activationError);
      const message =
        (activationError as any)?.message ||
        (activationError as any)?.details ||
        'Failed to complete activation';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { activation_number, is_free } = activationRows[0] as {
      activation_number: number;
      is_free: boolean;
    };

    // Fetch the QR token to return it to the client.
    // We intentionally avoid `.single()` here because there may be
    // historical duplicate rows for a profile. Instead, we select
    // and take the first result.
    const { data: qrCodes, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select('token')
      .eq('profile_id', userId)
      .limit(1);

    if (qrError || !qrCodes || qrCodes.length === 0) {
      console.error('Failed to fetch QR code after activation:', qrError);
      const message =
        (qrError as any)?.message ||
        (qrError as any)?.details ||
        'Activation completed but QR code is missing';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const qrCode = qrCodes[0];

    // Ensure QR image is stored in Supabase Storage `QR` bucket as {token}.png
    try {
      await uploadQrPngToBucket(qrCode.token);
    } catch (err) {
      console.error('Failed to upload QR PNG to QR bucket:', err);
      // Non-fatal: activation should still succeed even if image upload fails.
    }

    // Work out tiered pricing based on how many activations exist so far
    // 1–100   → free
    // 101–500 → ₹99
    // 501–1000 → ₹199
    // >1000   → ₹299
    const { count: existingActivations } = await supabaseAdmin
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('is_activation', true);

    const activationIndex = (existingActivations ?? 0) + 1;

    let amountPaise = 0;
    if (activationIndex <= 100) {
      amountPaise = 0;
    } else if (activationIndex <= 500) {
      amountPaise = 9900;
    } else if (activationIndex <= 1000) {
      amountPaise = 19900;
    } else {
      amountPaise = 29900;
    }

    const idempotencyKey = `activation-${userId}`;

    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .upsert(
        {
          profile_id: userId,
          amount_paise: amountPaise,
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
      isFree: amountPaise === 0,
      token: qrCode.token,
      pricePaise: amountPaise,
    });
  } catch (error) {
    console.error('Activation error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to activate QR';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

