import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../backend/supabaseAdminClient';
import { getBearerTokenFromRequest, verifySupabaseToken } from '../../../../../backend/supabaseJwtVerifier';

function generateQrToken() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

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

    // Mark user as paid
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_paid: true })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile payment status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // Ensure QR token exists
    const { data: existingToken, error: tokenError } = await supabaseAdmin
      .from('qr_codes')
      .select('token')
      .eq('profile_id', userId)
      .maybeSingle();

    if (tokenError && tokenError.code !== 'PGRST116') {
      console.error('Failed to fetch existing QR token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to initialize QR code' },
        { status: 500 }
      );
    }

    if (!existingToken) {
      const token = generateQrToken();
      const { error: insertError } = await supabaseAdmin
        .from('qr_codes')
        .insert({ profile_id: userId, token });

      if (insertError) {
        console.error('Failed to create QR token:', insertError);
        return NextResponse.json(
          { error: 'Failed to create QR code' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activate payment error:', error);
    return NextResponse.json(
      { error: 'Failed to activate payment' },
      { status: 500 }
    );
  }
}

