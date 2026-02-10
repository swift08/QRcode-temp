import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../../backend/supabaseAdminClient';
import {
  getBearerTokenFromRequest,
  verifySupabaseToken,
} from '../../../../../backend/supabaseJwtVerifier';
import { uploadQrPngToBucket } from '../../../../../backend/qrBucketUploader';

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

    // Fetch all fleet vehicles for this profile
    const { data: vehicles, error: vehiclesError } = await supabaseAdmin
      .from('fleet_vehicles')
      .select('id, qr_token')
      .eq('owner_profile_id', userId);

    if (vehiclesError) {
      console.error('Failed to fetch fleet vehicles for bulk QR generation:', vehiclesError);
      return NextResponse.json(
        { error: 'Failed to load fleet vehicles for QR generation' },
        { status: 500 }
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ vehicles: [] });
    }

    const results: { id: string; token: string; alreadyExists?: boolean }[] = [];

    for (const vehicle of vehicles) {
      // If a QR already exists, keep it as-is and include in the response
      if (vehicle.qr_token) {
        results.push({ id: vehicle.id, token: vehicle.qr_token, alreadyExists: true });
        continue;
      }

      const token = crypto.randomBytes(16).toString('hex');

      const { error: qrError } = await supabaseAdmin.from('qr_codes').insert({
        profile_id: userId,
        token,
        is_active: true,
      });

      if (qrError) {
        console.error('Failed to insert qr_codes row for fleet vehicle:', {
          vehicleId: vehicle.id,
          error: qrError,
        });
        // Skip updating this vehicle; continue with others
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from('fleet_vehicles')
        .update({ qr_token: token })
        .eq('id', vehicle.id);

      if (updateError) {
        console.error('Failed to update fleet_vehicles with qr_token (bulk):', {
          vehicleId: vehicle.id,
          error: updateError,
        });
      }

      try {
        await uploadQrPngToBucket(token);
      } catch (err) {
        console.error('Failed to upload fleet vehicle QR PNG to bucket (bulk):', err);
        // Non-fatal: QR token still exists and can be used later.
      }

      results.push({ id: vehicle.id, token });
    }

    return NextResponse.json({ vehicles: results });
  } catch (error) {
    console.error('generate-all-vehicle-qrs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate vehicle QRs' },
      { status: 500 }
    );
  }
}

