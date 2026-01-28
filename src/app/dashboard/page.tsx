'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Phone, User, LogOut, Loader2, QrCode, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentModal } from '@/components/PaymentModal';

interface Profile {
  id: string;
  full_name: string;
  mobile: string;
  is_paid: boolean;
  mobile_verified: boolean;
}

interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '' });
  const [savingContact, setSavingContact] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [organDonor, setOrganDonor] = useState(false);
  const [languageNote, setLanguageNote] = useState('');
  const [age, setAge] = useState('');
  const [emergencyInstruction, setEmergencyInstruction] = useState('');
  const [savingEmergencyProfile, setSavingEmergencyProfile] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const qrRef = useRef<SVGSVGElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, is_paid, mobile_verified')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('profile_id', user.id);

      setContacts(contactsData || []);

      // Fetch or generate QR token
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('token')
        .eq('profile_id', user.id)
        .single();

      if (qrData) {
        setQrToken(qrData.token);
      } else if (profileData.is_paid) {
        // Generate new token if paid but no token exists
        const token = Math.random().toString(36).substring(2, 9).toUpperCase();
        await supabase.from('qr_codes').insert({ profile_id: user.id, token });
        setQrToken(token);
      }

      // Fetch emergency profile + medical info + notes
      const [{ data: emergencyProfile }, { data: medicalInfo }, { data: emergencyNote }] =
        await Promise.all([
          supabase
            .from('emergency_profiles')
            .select('*')
            .eq('profile_id', user.id)
            .maybeSingle(),
          supabase
            .from('medical_info')
            .select('*')
            .eq('profile_id', user.id)
            .maybeSingle(),
          supabase
            .from('emergency_notes')
            .select('*')
            .eq('profile_id', user.id)
            .maybeSingle(),
        ]);

      if (emergencyProfile) {
        setGuardianPhone(emergencyProfile.guardian_phone || '');
        setBloodGroup(emergencyProfile.blood_group || '');
        setLanguageNote(emergencyProfile.language_note || '');
        setAge(emergencyProfile.age ? String(emergencyProfile.age) : '');
        setEmergencyInstruction(emergencyProfile.emergency_instruction || emergencyInstruction);
        setOrganDonor(emergencyProfile.organ_donor ?? false);
      }

      if (medicalInfo) {
        setAllergies(medicalInfo.allergies || '');
        setMedicalConditions(medicalInfo.medical_conditions || '');
        setMedications(medicalInfo.medications || '');
      }

      if (emergencyNote && emergencyNote.note) {
        setEmergencyInstruction(emergencyNote.note);
      }
    }
    setLoading(false);
  };

  const handleRequestOtp = async () => {
    if (!profile?.mobile) return;
    setOtpStatus(null);
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: profile.mobile }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to request OTP');
        return;
      }

      setOtpRequested(true);
      setOtpStatus('OTP sent to your mobile number.');
    } catch (error) {
      console.error('Request OTP error:', error);
      setOtpError('Something went wrong requesting OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.mobile || !otp) return;

    setOtpStatus(null);
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: profile.mobile, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to verify OTP');
        return;
      }

      setOtpStatus('Mobile number verified successfully.');
      setOtp('');
      // Refresh profile to reflect mobile_verified flag
      await fetchData();
    } catch (error) {
      console.error('Verify OTP error:', error);
      setOtpError('Something went wrong verifying OTP.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({
        profile_id: user?.id,
        ...newContact
      })
      .select()
      .single();

    if (!error && data) {
      setContacts([...contacts, data]);
      setNewContact({ name: '', relation: '', phone: '' });
      setIsAddingContact(false);
    }
    setSavingContact(false);
  };

  const handlePayment = () => {
    if (!userId) return;
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    // Activation + payment are handled inside the PaymentModal via /api/activate
    await fetchData();
    setIsPaymentOpen(false);
  };

  const handleSaveEmergencyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !profile) return;

    setEmergencyStatus(null);
    setEmergencyError(null);
    setSavingEmergencyProfile(true);

    try {
      const parsedAge = age ? parseInt(age, 10) : null;

      const [{ error: epError }, { error: miError }, { error: noteError }] =
        await Promise.all([
          supabase
            .from('emergency_profiles')
            .upsert(
              {
                profile_id: profile.id,
                blood_group: bloodGroup,
                guardian_phone: guardianPhone,
                emergency_instruction: emergencyInstruction,
                organ_donor: organDonor,
                language_note: languageNote,
                age: parsedAge,
              },
              { onConflict: 'profile_id' }
            ),
          supabase
            .from('medical_info')
            .upsert(
              {
                profile_id: profile.id,
                allergies,
                medical_conditions: medicalConditions,
                medications,
              },
              { onConflict: 'profile_id' }
            ),
          supabase
            .from('emergency_notes')
            .upsert(
              {
                profile_id: profile.id,
                note: emergencyInstruction,
              },
              { onConflict: 'profile_id' }
            ),
        ]);

      if (epError || miError || noteError) {
        console.error('Emergency profile save errors:', { epError, miError, noteError });
        setEmergencyError('Failed to save emergency profile. Please try again.');
      } else {
        setEmergencyStatus('Emergency profile saved successfully.');
      }
    } catch (error) {
      console.error('Save emergency profile error:', error);
      setEmergencyError('Something went wrong while saving.');
    } finally {
      setSavingEmergencyProfile(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current || !qrToken) return;

    const svg = qrRef.current;
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qrgency-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    };

    img.src = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">Dashboard</span>
          </div>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-red-600 transition-colors p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Card */}
        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Hello, {profile?.full_name}!</h1>
          <p className="text-zinc-500">Manage your emergency contacts and vehicle QR code.</p>

          {/* Mobile verification status */}
          {!profile?.mobile_verified && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Verify your mobile number
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  We use OTP verification to ensure we can reliably reach your guardian and emergency contacts.
                </p>
                {otpError && (
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {otpError}
                  </div>
                )}
                {otpStatus && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    {otpStatus}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition"
                  >
                    {otpRequested ? 'Resend OTP' : 'Send OTP'}
                  </button>
                  <form onSubmit={handleVerifyOtp} className="flex-1 flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-xs sm:text-sm"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                      disabled={!otp}
                    >
                      Verify
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Status & Payment */}
          <section className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-red-600" /> QR Status
              </h2>

              {!profile?.is_paid ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                    <div className="flex gap-4">
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                      <div>
                        <h3 className="font-bold text-amber-900 dark:text-amber-400">QR Not Active</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                          Activate your QRgency QR by paying a one-time fee of ₹10.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handlePayment}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20"
                  >
                    Pay ₹10 & Activate QR
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-fit p-4 bg-white rounded-3xl border-8 border-zinc-50 shadow-inner">
                    <QRCodeSVG 
                      ref={qrRef}
                      value={`https://${typeof window !== 'undefined' ? window.location.host : ''}/e/${qrToken}`} 
                      size={180}
                      level="H"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                    <CheckCircle2 className="w-5 h-5" /> Active
                  </div>
                  <p className="text-sm text-zinc-500">Token: <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{qrToken}</span></p>
                  <button 
                    onClick={handleDownloadQR}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-3 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download QR
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Emergency Contacts */}
          <section className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-red-600" /> Contacts
                </h2>
                {!isAddingContact && contacts.length < 3 && profile?.is_paid && (
                  <button 
                    onClick={() => setIsAddingContact(true)}
                    className="p-2 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {!profile?.is_paid ? (
                <div className="text-center py-12">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-500 text-sm">Activate your QR to add contacts.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">
                          {contact.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white">{contact.name}</div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wider">{contact.relation}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{contact.phone}</div>
                    </div>
                  ))}

                  {isAddingContact && (
                    <form onSubmit={handleAddContact} className="p-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-4">
                      <input
                        placeholder="Contact Name"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
                        value={newContact.name}
                        onChange={e => setNewContact({...newContact, name: e.target.value})}
                      />
                      <input
                        placeholder="Relation (e.g. Father)"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
                        value={newContact.relation}
                        onChange={e => setNewContact({...newContact, relation: e.target.value})}
                      />
                      <input
                        placeholder="Phone Number"
                        required
                        type="tel"
                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
                        value={newContact.phone}
                        onChange={e => setNewContact({...newContact, phone: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <button 
                          type="submit" 
                          disabled={savingContact}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                          {savingContact ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Contact'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingContact(false)}
                          className="px-4 py-2 text-zinc-500 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {contacts.length === 0 && !isAddingContact && (
                    <p className="text-center py-8 text-zinc-500 text-sm italic">No emergency contacts added yet.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Emergency Profile & Medical Info */}
        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" /> Emergency Profile
            </h2>
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Critical medical information
            </span>
          </div>

          {emergencyError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-800">
              {emergencyError}
            </div>
          )}
          {emergencyStatus && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-100 dark:border-emerald-800">
              {emergencyStatus}
            </div>
          )}

          <form onSubmit={handleSaveEmergencyProfile} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Guardian Phone (Primary)
                </label>
                <input
                  type="tel"
                  required
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    required
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm uppercase"
                    placeholder="O+"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                    placeholder="32"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Language Note
                </label>
                <input
                  type="text"
                  value={languageNote}
                  onChange={(e) => setLanguageNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="Prefers Kannada / Hindi"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="organ-donor"
                  type="checkbox"
                  checked={organDonor}
                  onChange={(e) => setOrganDonor(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
                />
                <label htmlFor="organ-donor" className="text-xs text-zinc-500">
                  Mark as organ donor
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Allergies (highlighted in red on scan page)
                </label>
                <textarea
                  required
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="E.g. Cannot tolerate anesthesia, allergic to penicillin"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Medical Conditions
                </label>
                <textarea
                  required
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="E.g. Diabetes, hypertension, epilepsy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Medications
                </label>
                <textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="E.g. On blood thinners, insulin"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Critical Emergency Instructions (shown prominently)
                </label>
                <textarea
                  required
                  value={emergencyInstruction}
                  onChange={(e) => setEmergencyInstruction(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="E.g. Contact guardian before surgery. Do not administer general anesthesia without prior evaluation."
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={savingEmergencyProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                {savingEmergencyProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Emergency Profile'
                )}
              </button>
            </div>
          </form>
        </section>
      </main>
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        userId={userId || ''}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
