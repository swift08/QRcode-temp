import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Phone, Shield, AlertTriangle, HeartPulse, Pill, Activity } from 'lucide-react';
import { supabaseAdmin } from '../../../../backend/supabaseAdminClient';
import { EmergencyContactActions } from './EmergencyContactActions';

interface EmergencyPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function EmergencyPage({ params }: EmergencyPageProps) {
  const { token } = await params;

  // Basic rate limiting / brute-force slowdown
  await new Promise((resolve) => setTimeout(resolve, 300));

  const { data: qrCode, error: qrError } = await supabaseAdmin
    .from('qr_codes')
    .select('profile_id')
    .eq('token', token)
    .single();

  if (!qrCode || qrError) {
    return notFound();
  }

  const [
    { data: profile },
    { data: emergencyProfile },
    { data: medicalInfo },
    { data: emergencyNote },
    { data: contacts },
    { data: fleetVehicle },
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('full_name, is_paid, mobile')
      .eq('id', qrCode.profile_id)
      .single(),
    supabaseAdmin
      .from('emergency_profiles')
      .select(
        'blood_group, guardian_phone, secondary_contact_phone, emergency_instruction, language_note, age, organ_donor'
      )
      .eq('profile_id', qrCode.profile_id)
      .maybeSingle(),
    supabaseAdmin
      .from('medical_info')
      .select('allergies, medical_conditions, medications')
      .eq('profile_id', qrCode.profile_id)
      .maybeSingle(),
    supabaseAdmin
      .from('emergency_notes')
      .select('note')
      .eq('profile_id', qrCode.profile_id)
      .maybeSingle(),
    supabaseAdmin
      .from('emergency_contacts')
      .select('id, name, relation, phone')
      .eq('profile_id', qrCode.profile_id)
      .order('created_at', { ascending: true }),
    // If this QR belongs to a fleet vehicle, we attach vehicle details
    supabaseAdmin
      .from('fleet_vehicles')
      .select('id, vehicle_number, label, make_model')
      .eq('qr_token', token)
      .maybeSingle(),
  ]);

  if (!profile || !profile.is_paid) {
    return notFound();
  }

  // Log the scan for admin analytics
  try {
    const h = await headers();
    const ip = h.get('x-forwarded-for') || 'unknown';
    const userAgent = h.get('user-agent') || 'unknown';

    await supabaseAdmin.from('scan_logs').insert({
      token,
      profile_id: qrCode.profile_id,
      ip,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Failed to log scan:', error);
  }

  const safeContacts = contacts || [];
  const criticalNote = emergencyNote?.note || emergencyProfile?.emergency_instruction || null;
  const allergies = medicalInfo?.allergies || null;
  const conditions = medicalInfo?.medical_conditions || null;
  const medications = medicalInfo?.medications || null;
  const bloodGroup = emergencyProfile?.blood_group || null;
  const guardianPhone = emergencyProfile?.guardian_phone || null;
  const secondaryPhone = emergencyProfile?.secondary_contact_phone || (safeContacts[0]?.phone ?? null);
  const age = emergencyProfile?.age ?? null;
  const languageNote = emergencyProfile?.language_note || null;
  const isOrganDonor = emergencyProfile?.organ_donor ?? false;
  const isFleetVehicle = !!fleetVehicle;

  // If this QR is tied to a fleet vehicle, try to resolve the currently assigned driver
  let fleetDriver: { name: string; phone: string | null; blood_group: string | null } | null =
    null;
  if (fleetVehicle?.id) {
    const { data: driverData, error: driverError } = await supabaseAdmin
      .from('fleet_drivers')
      .select('name, phone, blood_group')
      .eq('assigned_vehicle_id', fleetVehicle.id)
      .maybeSingle();

    if (driverError) {
      console.error('EmergencyPage: failed to fetch fleet driver for vehicle:', driverError);
    }
    if (driverData) {
      fleetDriver = {
        name: (driverData as any).name,
        phone: (driverData as any).phone ?? null,
        blood_group: (driverData as any).blood_group ?? null,
      };
    }
  }

  const driverName = fleetDriver?.name ?? null;
  const driverPhone = fleetDriver?.phone ?? null;
  const driverBloodGroup = fleetDriver?.blood_group ?? null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="px-6 py-4 border-b border-red-900/40 bg-gradient-to-r from-black via-zinc-950 to-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">kavach Emergency</h1>
            <p className="text-xs text-red-300 uppercase tracking-[0.2em]">
              ACT FAST · STAY CALM
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-stretch justify-between px-6 py-6 max-w-md mx-auto w-full gap-6">
        {/* Identity & critical note */}
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency information for:</span>
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {isFleetVehicle && driverName
                ? driverName
                : isFleetVehicle
                ? 'This vehicle & driver'
                : profile.full_name}
              {!isFleetVehicle && age ? (
                <span className="text-base text-zinc-400 ml-2">({age} yrs)</span>
              ) : null}
            </h2>
            {languageNote && (
              <p className="text-xs text-zinc-400">
                Preferred language:{' '}
                <span className="font-medium text-zinc-200">{languageNote}</span>
              </p>
            )}
          </div>

          {isFleetVehicle && (
            <>
              <div className="mt-2 rounded-3xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Vehicle details
                </p>
                <p className="text-sm text-zinc-100">
                  <span className="font-semibold">Company:</span> {profile.full_name}
                </p>
                {profile.mobile && (
                  <p className="text-sm text-zinc-100">
                    <span className="font-semibold">Company mobile:</span>{' '}
                    <span className="font-mono">{profile.mobile}</span>
                  </p>
                )}
                <p className="text-sm text-zinc-100">
                  <span className="font-semibold">Vehicle number:</span>{' '}
                  {fleetVehicle?.vehicle_number ?? '—'}
                </p>
                {(fleetVehicle?.make_model || fleetVehicle?.label) && (
                  <p className="text-sm text-zinc-100">
                    <span className="font-semibold">Vehicle name:</span>{' '}
                    {fleetVehicle?.make_model || fleetVehicle?.label}
                  </p>
                )}
              </div>

              {profile.mobile && (
                <div className="mt-3">
                  <a
                    href={`tel:${profile.mobile}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition"
                  >
                    Call owner
                  </a>
                </div>
              )}

              {(driverName || driverPhone || driverBloodGroup) && (
                <div className="mt-3 rounded-3xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    Driver details
                  </p>
                  {driverName && (
                    <p className="text-sm text-zinc-100">
                      <span className="font-semibold">Driver:</span> {driverName}
                    </p>
                  )}
                  {driverPhone && (
                    <p className="text-sm text-zinc-100">
                      <span className="font-semibold">Driver mobile:</span>{' '}
                      <span className="font-mono">{driverPhone}</span>
                    </p>
                  )}
                  {driverBloodGroup && (
                    <p className="text-sm text-zinc-100">
                      <span className="font-semibold">Driver blood group:</span> {driverBloodGroup}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {criticalNote && (
            <div className="rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-950/80 via-black to-red-900/40 px-4 py-3 shadow-[0_0_40px_rgba(248,113,113,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.25em] text-red-300 mb-1 flex items-center gap-2">
                <HeartPulse className="w-3 h-3" />
                Critical Emergency Instruction
              </p>
              <p className="text-sm leading-relaxed text-red-50">{criticalNote}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {bloodGroup && (
              <div className="px-4 py-2 rounded-2xl bg-red-600 text-white text-sm font-semibold flex items-center gap-2 shadow-[0_0_30px_rgba(248,113,113,0.6)]">
                <Activity className="w-4 h-4" />
                <span>Blood: {bloodGroup}</span>
              </div>
            )}
            {isOrganDonor && (
              <div className="px-3 py-1.5 rounded-2xl border border-emerald-500/60 text-[11px] text-emerald-300 uppercase tracking-[0.18em]">
                Organ Donor
              </div>
            )}
          </div>
        </section>

        {/* Medical details & call actions */}
        <section className="space-y-4">
          {/* Allergies & conditions */}
          <div className="space-y-3">
            {allergies && (
              <div className="rounded-2xl border border-red-600/60 bg-red-950/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-red-300 mb-1 flex items-center gap-2">
                  <Pill className="w-3 h-3" />
                  Severe Allergies
                </p>
                <p className="text-sm text-red-50 leading-relaxed">{allergies}</p>
              </div>
            )}

            {(conditions || medications) && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 space-y-2">
                {conditions && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 mb-1">
                      Medical Conditions
                    </p>
                    <p className="text-sm text-zinc-100 leading-relaxed">
                      {conditions}
                    </p>
                  </div>
                )}
                {medications && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 mb-1">
                      Medications
                    </p>
                    <p className="text-sm text-zinc-100 leading-relaxed">
                      {medications}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact buttons with 5-minute masked virtual view */}
          <EmergencyContactActions
            guardianPhone={guardianPhone}
            secondaryPhone={secondaryPhone}
            contacts={safeContacts}
          />

          {/* Government helplines - fixed */}
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <a
                href="tel:112"
                className="py-3 px-2 rounded-2xl bg-red-600 text-center text-[11px] font-semibold tracking-wide hover:bg-red-700 active:scale-[0.97] transition"
              >
                Ambulance
                <div className="text-xs font-mono mt-0.5">112</div>
              </a>
              <a
                href="tel:112"
                className="py-3 px-2 rounded-2xl bg-zinc-900 text-center text-[11px] font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.97] transition"
              >
                Police
                <div className="text-xs font-mono mt-0.5">112</div>
              </a>
              <a
                href="tel:112"
                className="py-3 px-2 rounded-2xl bg-zinc-900 text-center text-[11px] font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.97] transition"
              >
                Fire
                <div className="text-xs font-mono mt-0.5">112</div>
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
              This page does not collect data from you. It only shows emergency information
              configured by the vehicle owner so you can help them quickly.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

