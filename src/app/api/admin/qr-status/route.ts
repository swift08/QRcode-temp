import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../../../backend/supabaseAdminClient';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const adminAuth = cookieStore.get('admin_auth');

    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, active } = await request.json();

    if (!profileId || typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'profileId and active flag are required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('qr_codes')
      .update({ is_active: active })
      .eq('profile_id', profileId);

    if (error) {
      console.error('Failed to update QR status:', error);
      return NextResponse.json(
        { error: 'Failed to update QR status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin QR status error:', error);
    return NextResponse.json(
      { error: 'Failed to update QR status' },
      { status: 500 }
    );
  }
}

