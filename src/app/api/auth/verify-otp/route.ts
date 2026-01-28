import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../../../backend/supabaseAdminClient';

function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { mobile, otp } = await request.json();

    if (!mobile || typeof mobile !== 'string' || !otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // Fetch the latest, non-expired OTP for this mobile
    const { data: record, error: fetchError } = await supabaseAdmin
      .from('mobile_verification')
      .select('id, otp_hash, expires_at, attempts')
      .eq('mobile', mobile)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Verify OTP fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
        { status: 500 }
      );
    }

    if (!record) {
      return NextResponse.json(
        { error: 'OTP expired or not found' },
        { status: 400 }
      );
    }

    const expectedHash = record.otp_hash;
    const providedHash = hashOtp(otp);

    if (expectedHash !== providedHash) {
      await supabaseAdmin
        .from('mobile_verification')
        .update({ attempts: (record.attempts ?? 0) + 1 })
        .eq('id', record.id);

      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Mark the profile with this mobile as verified
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('mobile', mobile)
      .single();

    if (profileError || !profile) {
      console.error('Profile lookup error for OTP verification:', profileError);
      return NextResponse.json(
        { error: 'Profile not found for this mobile number' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ mobile_verified: true })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to mark mobile as verified:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

