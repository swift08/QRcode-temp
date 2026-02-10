'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Plus,
  Phone,
  User,
  LogOut,
  Loader2,
  QrCode,
  Download,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentModal } from '@/components/PaymentModal';
import { motion } from 'framer-motion';
import { Card3D } from '@/components/Card3D';

interface Profile {
  id: string;
  full_name: string;
  mobile: string;
  is_paid: boolean;
  mobile_verified: boolean;
  date_of_birth?: string | null;
  account_type?: 'personal' | 'commercial' | null;
}

interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

interface FleetVehicle {
  id: string;
  owner_profile_id: string;
  vehicle_number: string;
  label: string | null;
  make_model: string | null;
  qr_token?: string | null;
  created_at: string;
}

interface FleetDriver {
  id: string;
  owner_profile_id: string;
  name: string;
  phone: string;
  blood_group: string | null;
  notes: string | null;
  assigned_vehicle_id: string | null;
  created_at: string;
}

type PageProps = {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default function DashboardPage(props: PageProps) {
  if (props.params) React.use(props.params);
  if (props.searchParams) React.use(props.searchParams);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [fleetDrivers, setFleetDrivers] = useState<FleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '' });
  const [savingContact, setSavingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState({ name: '', relation: '', phone: '' });
  const [savingContactEdit, setSavingContactEdit] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Saved emergency profile values (used for summaries / scan)
  const [guardianPhone, setGuardianPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [organDonor, setOrganDonor] = useState(false);
  const [languageNote, setLanguageNote] = useState('');
  const [age, setAge] = useState('');
  const [emergencyInstruction, setEmergencyInstruction] = useState('');

  // Form-only state: used to submit, not to display saved values
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formBloodGroup, setFormBloodGroup] = useState('');
  const [formAllergies, setFormAllergies] = useState('');
  const [formMedicalConditions, setFormMedicalConditions] = useState('');
  const [formMedications, setFormMedications] = useState('');
  const [formOrganDonor, setFormOrganDonor] = useState(false);
  const [formLanguageNote, setFormLanguageNote] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formEmergencyInstruction, setFormEmergencyInstruction] = useState('');
  const [savingEmergencyProfile, setSavingEmergencyProfile] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  // B2B fleet vehicle modal state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverBloodGroup, setDriverBloodGroup] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [driverSaving, setDriverSaving] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);
  const qrRef = useRef<SVGSVGElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

    // Fetch profile (including date_of_birth so we can derive age); use maybeSingle so new users without a row don't error
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, is_paid, mobile_verified, date_of_birth')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      setLoading(false);
      return;
    }

    // Use profile row or fallback from auth user metadata so UI always has a profile when logged in.
    // Also carry over account_type from auth metadata (personal vs commercial) even if the column
    // does not yet exist in the profiles table.
    const accountType =
      (user.user_metadata?.account_type as 'personal' | 'commercial' | undefined) ?? 'personal';

    const effectiveProfile: Profile =
      profileData !== null
        ? { ...profileData, account_type: accountType }
        : {
            id: user.id,
            full_name: (user.user_metadata?.full_name as string) || 'User',
            mobile: (user.user_metadata?.mobile as string) || '',
            is_paid: false,
            mobile_verified: false,
            date_of_birth: null as string | null,
            account_type: accountType,
          };
    setProfile(effectiveProfile);

    {
      const profileData = effectiveProfile;

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('profile_id', user.id);

      setContacts(contactsData || []);

      // For commercial accounts, fetch fleet vehicles owned by this profile
      if (profileData.account_type === 'commercial') {
        const { data: fleetData, error: fleetError } = await supabase
          .from('fleet_vehicles')
          .select('id, owner_profile_id, vehicle_number, label, make_model, qr_token, created_at')
          .eq('owner_profile_id', user.id)
          .order('created_at', { ascending: false });

        if (fleetError) {
          console.error('Error fetching fleet vehicles:', fleetError);
        }
        setFleetVehicles(fleetData || []);

        // Fetch drivers for this fleet owner
        const { data: driverData, error: driverError } = await supabase
          .from('fleet_drivers')
          .select(
            'id, owner_profile_id, name, phone, blood_group, notes, assigned_vehicle_id, created_at'
          )
          .eq('owner_profile_id', user.id)
          .order('created_at', { ascending: false });

        if (driverError) {
          console.error('Error fetching fleet drivers:', driverError);
        }
        setFleetDrivers(driverData || []);
      }

      // Fetch or generate QR token (tolerant of duplicate rows)
      const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('token')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();

      if (qrError && qrError.code !== 'PGRST116') {
        console.error('Error fetching QR code:', qrError);
      }

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
        const guardian = emergencyProfile.guardian_phone || '';
        const blood = emergencyProfile.blood_group || '';
        const lang = emergencyProfile.language_note || '';

        // Prefer age derived from date_of_birth on profile, fall back to stored age
        let ageVal = '';
        if (profileData.date_of_birth) {
          const dob = new Date(profileData.date_of_birth);
          if (!Number.isNaN(dob.getTime())) {
            const today = new Date();
            let years = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
              years--;
            }
            ageVal = String(years);
          }
        }
        if (!ageVal && emergencyProfile.age) {
          ageVal = String(emergencyProfile.age);
        }
        const instruction = emergencyProfile.emergency_instruction || emergencyInstruction;
        const donor = emergencyProfile.organ_donor ?? false;

        // Saved snapshot (for summaries / scan)
        setGuardianPhone(guardian);
        setBloodGroup(blood);
        setLanguageNote(lang);
        setAge(ageVal);
        setEmergencyInstruction(instruction);
        setOrganDonor(donor);

        // Prefill form so user can edit later
        setFormGuardianPhone(guardian);
        setFormBloodGroup(blood);
        setFormLanguageNote(lang);
        setFormAge(ageVal);
        setFormEmergencyInstruction(instruction);
        setFormOrganDonor(donor);
      }

      if (medicalInfo) {
        const allergiesVal = medicalInfo.allergies || '';
        const conditionsVal = medicalInfo.medical_conditions || '';
        const medsVal = medicalInfo.medications || '';

        // Saved snapshot
        setAllergies(allergiesVal);
        setMedicalConditions(conditionsVal);
        setMedications(medsVal);

        // Prefill form
        setFormAllergies(allergiesVal);
        setFormMedicalConditions(conditionsVal);
        setFormMedications(medsVal);
      }

      if (emergencyNote && emergencyNote.note) {
        setEmergencyInstruction(emergencyNote.note);
        setFormEmergencyInstruction(emergencyNote.note);
      }
    }
  } catch (err) {
    console.error('Dashboard fetchData error:', err);
  } finally {
    setLoading(false);
  }
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
      const updated = [...contacts, data];
      setContacts(updated);
      setNewContact({ name: '', relation: '', phone: '' });
      // Keep the form open so user can add another contact
      // but close it automatically once the max (3) is reached
      if (updated.length >= 3) {
        setIsAddingContact(false);
      }
    }
    setSavingContact(false);
  };

  const handleStartEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditingContact({
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone,
    });
  };

  const handleCancelEditContact = () => {
    setEditingContactId(null);
    setEditingContact({ name: '', relation: '', phone: '' });
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContactId) return;
    setSavingContactEdit(true);

    const { data, error } = await supabase
      .from('emergency_contacts')
      .update({
        name: editingContact.name,
        relation: editingContact.relation,
        phone: editingContact.phone,
      })
      .eq('id', editingContactId)
      .select()
      .single();

    if (!error && data) {
      setContacts((prev) =>
        prev.map((c) => (c.id === editingContactId ? (data as Contact) : c))
      );
      setEditingContactId(null);
      setEditingContact({ name: '', relation: '', phone: '' });
    }

    setSavingContactEdit(false);
  };

  const handleDeleteContact = async (id: string) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);

    if (!error) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (editingContactId === id) {
        handleCancelEditContact();
      }
    }
  };

  const handlePayment = () => {
    if (!userId) return;
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    // Activation + payment are handled inside the PaymentModal via /api/activate.
    // After activation, for fleet (commercial) accounts we also bulk-generate
    // vehicle QRs so HR does not need to click "Generate QR" per vehicle.
    await fetchData();
    await ensureFleetVehicleQrs();
    setIsPaymentOpen(false);
  };

  const handleSaveEmergencyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !profile) return;

    setEmergencyStatus(null);
    setEmergencyError(null);
    setSavingEmergencyProfile(true);

    try {
      const parsedAge = formAge ? parseInt(formAge, 10) : null;

      // Backend tables have NOT NULL constraints for some fields.
      // To avoid save failures when user leaves them blank, send a safe placeholder.
      const safeAllergies =
        formAllergies.trim() === '' ? 'Not specified' : formAllergies;
      const safeMedicalConditions =
        formMedicalConditions.trim() === '' ? 'Not specified' : formMedicalConditions;
      const safeEmergencyInstruction =
        formEmergencyInstruction.trim() === ''
          ? 'Not specified'
          : formEmergencyInstruction;

      const [{ error: epError }, { error: miError }, { error: noteError }] =
        await Promise.all([
          supabase
            .from('emergency_profiles')
            .upsert(
              {
                profile_id: profile.id,
                blood_group: formBloodGroup.toUpperCase(),
                guardian_phone: formGuardianPhone,
                emergency_instruction: safeEmergencyInstruction,
                organ_donor: formOrganDonor,
                language_note: formLanguageNote,
                age: parsedAge,
              },
              { onConflict: 'profile_id' }
            ),
          supabase
            .from('medical_info')
            .upsert(
              {
                profile_id: profile.id,
                allergies: safeAllergies,
                medical_conditions: safeMedicalConditions,
                medications: formMedications,
              },
              { onConflict: 'profile_id' }
            ),
          supabase
            .from('emergency_notes')
            .upsert(
              {
                profile_id: profile.id,
                note: safeEmergencyInstruction,
              },
              { onConflict: 'profile_id' }
            ),
        ]);

      if (epError || miError || noteError) {
        console.error('Emergency profile save errors:', { epError, miError, noteError });
        setEmergencyError('Failed to save emergency profile. Please try again.');
      } else {
        // Update saved snapshot used in summaries
        setGuardianPhone(formGuardianPhone);
        setBloodGroup(formBloodGroup.toUpperCase());
        setLanguageNote(formLanguageNote);
        setAge(formAge);
        setEmergencyInstruction(safeEmergencyInstruction);
        setOrganDonor(formOrganDonor);
        setAllergies(safeAllergies);
        setMedicalConditions(safeMedicalConditions);
        setMedications(formMedications);

        // Keep form values so user can edit / delete later.
        setEmergencyStatus('Emergency profile saved successfully.');
      }
    } catch (error) {
      console.error('Save emergency profile error:', error);
      setEmergencyError('Something went wrong while saving.');
    } finally {
      setSavingEmergencyProfile(false);
    }
  };

  const downloadQrFromInlineSvg = () => {
    if (typeof document === 'undefined') return;
    if (!qrRef.current) return;

    try {
      const svgElement = qrRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      const blob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return;
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = 'kavach-qr.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(pngUrl);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error('Failed to export QR from inline SVG:', err);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrToken) {
      console.error('QR download requested but qrToken is missing');
      return;
    }

    try {
      const res = await fetch(`/api/qr/${qrToken}`);
      if (!res.ok) {
        // If the storage-backed PNG is missing (e.g. QR not yet uploaded),
        // fall back to downloading the on-screen SVG version instead.
        const errorText = await res.text();
        console.error('QR download API error', errorText);
        downloadQrFromInlineSvg();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kavach-qr.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR via API:', err);
      // As a safety net, attempt client-side export if the API path fails.
      downloadQrFromInlineSvg();
    }
  };

  const ensureFleetVehicleQrs = async () => {
    // Only relevant for B2B / commercial accounts
    if (profile?.account_type !== 'commercial') return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        console.error('ensureFleetVehicleQrs: no active session');
        return;
      }

      const res = await fetch('/api/fleet/generate-all-vehicle-qrs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to bulk-generate fleet vehicle QRs:', data.error);
        return;
      }

      if (!Array.isArray(data.vehicles)) return;

      const tokensById = new Map<string, string>();
      for (const v of data.vehicles as { id: string; token: string }[]) {
        tokensById.set(v.id, v.token);
      }

      if (tokensById.size === 0) return;

      setFleetVehicles((prev) =>
        prev.map((vehicle) =>
          tokensById.has(vehicle.id)
            ? { ...vehicle, qr_token: tokensById.get(vehicle.id) ?? vehicle.qr_token }
            : vehicle
        )
      );
    } catch (err) {
      console.error('ensureFleetVehicleQrs client error:', err);
    }
  };

  const handleGenerateVehicleQr = async (vehicleId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        console.error('generateVehicleQr: no active session');
        return;
      }

      const res = await fetch('/api/fleet/generate-vehicle-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to generate vehicle QR:', data.error);
        return;
      }
      if (!data.token) return;

      // Update local state so UI reflects the new QR token
      setFleetVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, qr_token: data.token } : v))
      );
    } catch (err) {
      console.error('generateVehicleQr client error:', err);
    }
  };

  const handleDownloadVehicleQr = async (token: string) => {
    try {
      const res = await fetch(`/api/qr/${token}`);
      if (!res.ok) {
        console.error('Vehicle QR download API error', await res.text());
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kavach-vehicle-qr.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download vehicle QR:', err);
    }
  };

  const scrollToEmergencyProfile = () => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('emergency-profile');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError(null);

    if (!profile?.id) {
      setVehicleError('Profile not loaded. Please refresh the page.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setVehicleError('Vehicle number is required.');
      return;
    }

    setVehicleSaving(true);
    try {
      // Requires a `fleet_vehicles` table with at least:
      // owner_profile_id (uuid), vehicle_number (text), label (text), make_model (text).
      const { error } = await supabase.from('fleet_vehicles').insert({
        owner_profile_id: profile.id,
        vehicle_number: vehicleNumber.trim(),
        label: vehicleLabel.trim() || null,
        make_model: vehicleMakeModel.trim() || null,
      });

      if (error) {
        console.error('Failed to create fleet vehicle:', error);
        setVehicleError(error.message ?? 'Failed to save vehicle.');
        return;
      }

      // Clear form and close modal so HR can continue adding vehicles
      setVehicleNumber('');
      setVehicleLabel('');
      setVehicleMakeModel('');
      setIsVehicleModalOpen(false);
    } catch (err) {
      console.error('Create vehicle error:', err);
      setVehicleError(
        err instanceof Error ? err.message : 'Something went wrong while saving vehicle.'
      );
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError(null);

    if (!profile?.id) {
      setDriverError('Profile not loaded. Please refresh the page.');
      return;
    }
    if (!driverName.trim() || !driverPhone.trim()) {
      setDriverError('Driver name and phone are required.');
      return;
    }

    setDriverSaving(true);
    try {
      const { data, error } = await supabase
        .from('fleet_drivers')
        .insert({
          owner_profile_id: profile.id,
          name: driverName.trim(),
          phone: driverPhone.trim(),
          blood_group: driverBloodGroup.trim() || null,
          notes: driverNotes.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create driver:', error);
        setDriverError(error.message ?? 'Failed to save driver.');
        return;
      }

      setFleetDrivers((prev) => [data as FleetDriver, ...prev]);
      setDriverName('');
      setDriverPhone('');
      setDriverBloodGroup('');
      setDriverNotes('');
      setIsDriverModalOpen(false);
    } catch (err) {
      console.error('Create driver error:', err);
      setDriverError(err instanceof Error ? err.message : 'Something went wrong while saving.');
    } finally {
      setDriverSaving(false);
    }
  };

  const handleAssignDriver = async (driverId: string, vehicleId: string | null) => {
    try {
      const { data, error } = await supabase
        .from('fleet_drivers')
        .update({ assigned_vehicle_id: vehicleId })
        .eq('id', driverId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update driver assignment:', error);
        return;
      }

      setFleetDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? (data as FleetDriver) : d))
      );
    } catch (err) {
      console.error('Update driver assignment error:', err);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        'Are you sure you would like to delete this driver? This will remove their assignments as well.'
      );
      if (!ok) return;
    }

    try {
      const { error } = await supabase.from('fleet_drivers').delete().eq('id', driverId);
      if (error) {
        console.error('Failed to delete driver:', error);
        return;
      }

      setFleetDrivers((prev) => prev.filter((d) => d.id !== driverId));
    } catch (err) {
      console.error('Delete driver error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const sectionVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } } };

  // B2B / commercial dashboard – separate interface for fleet owners.
  if (profile?.account_type === 'commercial') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm"
        >
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900 dark:text-white">Fleet Dashboard</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-red-500">
                  B2B · Vehicles & Drivers
                </span>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="w-9 h-9 rounded-full bg-zinc-900 text-white dark:bg.white dark:text-zinc-900 flex items-center justify-center hover:opacity-90 transition-colors"
              >
                <User className="w-4 h-4" />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg.white dark:bg-zinc-900 shadow-lg py-1 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileMenuOpen(false);
                      await supabase.auth.signOut();
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-5xl mx-auto px-4 py-8 space-y-8"
        >
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="rounded-[32px] overflow-hidden"
          >
            <Card3D
              tilt={false}
              lift
              className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Welcome, {profile?.full_name}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Manage your fleet vehicles and drivers from one place. Vehicle QR codes stay fixed to
                the vehicle, while drivers can be reassigned any time.
              </p>
            </Card3D>
          </motion.section>

          {/* Quick assignment overview: link drivers to vehicles */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Driver · Vehicle assignments
                </h2>
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Vehicles stay fixed · drivers can change
                </p>
              </div>
            </div>

            {fleetDrivers.length > 0 && fleetVehicles.length > 0 ? (
              <div className="mt-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 max-h-60 overflow-auto">
                {fleetVehicles.map((vehicle) => {
                  const assignedDriver = fleetDrivers.find(
                    (d) => d.assigned_vehicle_id === vehicle.id
                  );
                  return (
                    <div
                      key={vehicle.id}
                      className="px-3 py-2.5 flex items-center justify-between gap-3 border-b last:border-b-0 border-zinc-100 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          {vehicle.vehicle_number}
                        </span>
                        {assignedDriver && (
                          <>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Driver: {assignedDriver.name}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                              {assignedDriver.phone}
                            </span>
                          </>
                        )}
                        {!assignedDriver && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            No driver assigned
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <select
                          className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-[11px] text-zinc-900 dark:text-white"
                          value={assignedDriver?.id ?? ''}
                          onChange={(e) => {
                            const newDriverId = e.target.value;
                            if (!newDriverId) {
                              // Unassign current driver (if any) from this vehicle
                              if (assignedDriver) {
                                handleAssignDriver(assignedDriver.id, null);
                              }
                            } else {
                              handleAssignDriver(newDriverId, vehicle.id);
                            }
                          }}
                        >
                          <option value="">No driver</option>
                          {fleetDrivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-400">
                Add at least one vehicle and one driver to start assigning.
              </p>
            )}
          </motion.section>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Fleet Vehicles
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Step 1 · Add all vehicles
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVehicleModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 active:scale-[0.97] transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Vehicle</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePayment}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Proceed to QR activation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/fleet')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <span>Manage vehicles</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Add vehicles by registration number first. You can add many vehicles for the same
                company, and when you&apos;re ready, use &quot;Proceed to QR activation&quot; to
                pay and activate QR codes in one go.
              </p>

              {fleetVehicles.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 max-h-60 overflow-auto">
                  {fleetVehicles.map((v) => (
                    <div
                      key={v.id}
                      className="px-3 py-2.5 flex items-center justify-between gap-3 border-b last:border-b-0 border-zinc-100 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          {v.vehicle_number}
                        </span>
                        {v.label && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {v.label}
                          </span>
                        )}
                        {v.make_model && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {v.make_model}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {v.qr_token ? (
                          <>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-green-600">
                              QR ready
                            </span>
                            <button
                              type="button"
                              onClick={() => v.qr_token && handleDownloadVehicleQr(v.qr_token)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGenerateVehicleQr(v.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Generate QR</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-zinc-400">
                  No vehicles added yet. Use &quot;Add Vehicle&quot; to register your first vehicle.
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Drivers & Assignments
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDriverModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 text-white text-[11px] font-medium hover:bg-red-700 active:scale-[0.97] transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add driver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/drivers')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <span>Manage drivers</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Register drivers and assign them to vehicles. QR codes stay fixed to vehicles, while
                drivers can change over time.
              </p>

              {/* Driver list – read-only snapshot (full management on /drivers) */}
              {fleetDrivers.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 max-h-60 overflow-auto">
                  {fleetDrivers.map((driver) => {
                    const assignedVehicle = fleetVehicles.find(
                      (v) => v.id === driver.assigned_vehicle_id
                    );
                    return (
                      <div
                        key={driver.id}
                        className="px-3 py-2.5 flex items-center justify-between gap-3 border-b last:border-b-0 border-zinc-100 dark:border-zinc-800 text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            {driver.name}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                            {driver.phone}
                          </span>
                          {driver.blood_group && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Blood group: {driver.blood_group}
                            </span>
                          )}
                          {assignedVehicle && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Assigned to: {assignedVehicle.vehicle_number}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-xs text-zinc-400">
                  No drivers added yet. Use the form above to create your first driver.
                </p>
              )}
            </div>
          </motion.section>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Step 2 · Activate your QR
                </h2>
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Payment & activation for your fleet
                </p>
              </div>
            </div>

            {!profile?.is_paid ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Once you&apos;ve added all vehicles, activate your Kavach QR for this fleet. After
                  activation you can download the QR and print stickers for every vehicle.
                </p>
                <button
                  type="button"
                  onClick={handlePayment}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition"
                >
                  <Shield className="w-4 h-4" />
                  <span>Activate QR for this fleet</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-3 rounded-2xl bg-red-100 dark:bg-red-900/30">
                    <QrCode className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      QR activated for this fleet
                    </p>
                    {qrToken && (
                      <p className="text-[11px] text-zinc-500">
                        Token:{' '}
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {qrToken}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Download the activated QR and print one sticker per vehicle. Each scan will use the
                  emergency contacts and information configured for this fleet owner.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download activated QR</span>
                </button>
              </div>
            )}
          </motion.section>
        </motion.main>
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          userId={userId || ''}
          onSuccess={handlePaymentSuccess}
          vehicleCount={fleetVehicles.length}
        />

        {isVehicleModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsVehicleModalOpen(false)}
            />
            <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Add Vehicle
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Save your vehicle details first, then activate its QR.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {vehicleError && (
                <div className="mb-3 text-xs text-red-600 dark:text-red-400">
                  {vehicleError}
                </div>
              )}

              <form onSubmit={handleCreateVehicle} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white"
                    placeholder="KA01AB1234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Label (optional)
                  </label>
                  <input
                    type="text"
                    value={vehicleLabel}
                    onChange={(e) => setVehicleLabel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white"
                    placeholder="E.g. Cab #21, Delivery Bike 3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Make &amp; Model (optional)
                  </label>
                  <input
                    type="text"
                    value={vehicleMakeModel}
                    onChange={(e) => setVehicleMakeModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white"
                    placeholder="E.g. Tata Ace, Honda Activa"
                  />
                </div>

                <button
                  type="submit"
                  disabled={vehicleSaving}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {vehicleSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving vehicle…</span>
                    </>
                  ) : (
                    <span>Save Vehicle</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {isDriverModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDriverModalOpen(false)}
            />
            <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Add Driver
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Save driver details and optionally link them to a vehicle later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {driverError && (
                <div className="mb-3 text-xs text-red-600 dark:text-red-400">{driverError}</div>
              )}

              <form onSubmit={handleCreateDriver} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Driver name
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white"
                    placeholder="E.g. Ramesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Blood group (optional)
                  </label>
                  <input
                    type="text"
                    value={driverBloodGroup}
                    onChange={(e) => setDriverBloodGroup(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm uppercase text-zinc-900 dark:text-white"
                    placeholder="O+"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={driverNotes}
                    onChange={(e) => setDriverNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white"
                    placeholder="E.g. Night shift driver, speaks Kannada and Hindi"
                  />
                </div>

                <button
                  type="submit"
                  disabled={driverSaving}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {driverSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving driver…</span>
                    </>
                  ) : (
                    <span>Save Driver</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
        className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm"
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 dark:text-white">Dashboard</span>
              {profile?.account_type === 'commercial' && (
                <span className="text-[11px] uppercase tracking-[0.2em] text-red-500">
                  B2B · Fleet mode
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="w-9 h-9 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center hover:opacity-90 transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (typeof window !== 'undefined') {
                      const el = document.getElementById('qr-section');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Your QR</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    await supabase.auth.signOut();
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-5xl mx-auto px-4 py-8 space-y-8"
      >
        {/* Welcome Card (OTP verification temporarily hidden) */}
        <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="rounded-[32px] overflow-hidden">
          <Card3D tilt={false} lift className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Hello, {profile?.full_name}!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">Manage your emergency contacts and vehicle QR code.</p>
          </Card3D>
        </motion.section>

        {/* Emergency Contacts overview (between welcome and profile) */}
        {contacts.length > 0 && (
          <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-600" /> Emergency Contacts
              </h2>
              <span className="text-[11px] text-zinc-400 uppercase tracking-[0.18em]">
                Saved ({contacts.length})
              </span>
            </div>
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 divide-y divide-zinc-100 dark:divide-zinc-800">
              {contacts.map((contact) => (
                <div key={contact.id} className="px-3 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 text-sm font-bold">
                      {contact.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">
                        {contact.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                        {contact.relation}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">{contact.phone}</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Emergency Profile (basic info) */}
        <motion.section
          id="emergency-profile"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" /> Emergency Profile
            </h2>
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Basic details
            </span>
          </div>

          {emergencyError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-800">
              {emergencyError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={profile?.full_name || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 text-sm text-zinc-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={formGuardianPhone}
                  onChange={(e) => setFormGuardianPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Blood Group
                  </label>
                  <select
                    required
                    value={formBloodGroup}
                    onChange={(e) => setFormBloodGroup(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm uppercase"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                    placeholder="32"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Language
                </label>
                <select
                  value={formLanguageNote}
                  onChange={(e) => setFormLanguageNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                >
                  <option value="" disabled>
                    Select preferred language
                  </option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Odia">Odia</option>
                  <option value="Assamese">Assamese</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="organ-donor"
                  type="checkbox"
                  checked={formOrganDonor}
                  onChange={(e) => setFormOrganDonor(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
                />
                <label htmlFor="organ-donor" className="text-xs text-zinc-500">
                  Mark as organ donor
                </label>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Emergency Medical Info */}
        <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-600" /> Medical Information
            </h2>
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Critical medical details
            </span>
          </div>

          <form onSubmit={handleSaveEmergencyProfile} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Allergies (highlighted in red on scan page)
                </label>
                <textarea
                  value={formAllergies}
                  onChange={(e) => setFormAllergies(e.target.value)}
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
                  value={formMedicalConditions}
                  onChange={(e) => setFormMedicalConditions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-sm"
                  placeholder="E.g. Diabetes, hypertension, epilepsy"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Medications
                </label>
                <textarea
                  value={formMedications}
                  onChange={(e) => setFormMedications(e.target.value)}
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
                  value={formEmergencyInstruction}
                  onChange={(e) => setFormEmergencyInstruction(e.target.value)}
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
                  'Save Emergency Info'
                )}
              </button>
            </div>
          </form>
        </motion.section>

        <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-8">
          {/* QR Status & Payment */}
          <section className="space-y-6" id="qr-section">
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
                          Activate your kavach QR by paying a one-time fee of ₹299.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handlePayment}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20"
                  >
                    Pay ₹299 & Activate QR
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-fit p-4 bg-white rounded-3xl border-8 border-zinc-50 shadow-inner">
                    <QRCodeSVG 
                      ref={qrRef}
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/e/${qrToken}`} 
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

              {/* Compact summary of Emergency Profile in this card */}
              {(guardianPhone || bloodGroup || age || languageNote || emergencyInstruction) && (
                <div className="mb-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Emergency profile summary
                    </span>
                    <div className="flex items-center gap-2">
                      {bloodGroup && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600">
                          {bloodGroup}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={scrollToEmergencyProfile}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    {guardianPhone && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          Guardian
                        </span>
                        <span className="font-mono">{guardianPhone}</span>
                      </div>
                    )}
                    {age && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          Age
                        </span>
                        <span>{age} yrs</span>
                      </div>
                    )}
                    {languageNote && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          Language
                        </span>
                        <span className="truncate max-w-[220px] text-right">{languageNote}</span>
                      </div>
                    )}
                    {emergencyInstruction && (
                      <div className="mt-1">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 mb-1">
                          Critical note
                        </p>
                        <p className="text-xs text-zinc-700 dark:text-zinc-200 line-clamp-2">
                          {emergencyInstruction}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!profile?.is_paid ? (
                <div className="text-center py-12">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-500 text-sm">Activate your QR to add contacts.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.length > 0 && (
                    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {contacts.map((contact) =>
                        editingContactId === contact.id ? (
                          <form
                            key={contact.id}
                            onSubmit={handleUpdateContact}
                            className="px-4 py-3 space-y-3"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Edit contact
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelEditContact}
                                className="text-xs text-zinc-500 hover:text-red-600"
                              >
                                Cancel
                              </button>
                            </div>
                            <input
                              placeholder="Contact Name"
                              required
                              className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
                              value={editingContact.name}
                              onChange={(e) =>
                                setEditingContact((prev) => ({ ...prev, name: e.target.value }))
                              }
                            />
                            <input
                              placeholder="Relation (e.g. Father)"
                              required
                              className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
                              value={editingContact.relation}
                              onChange={(e) =>
                                setEditingContact((prev) => ({ ...prev, relation: e.target.value }))
                              }
                            />
                            <input
                              placeholder="Phone Number"
                              required
                              type="tel"
                              className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
                              value={editingContact.phone}
                              onChange={(e) =>
                                setEditingContact((prev) => ({ ...prev, phone: e.target.value }))
                              }
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={savingContactEdit}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                              >
                                {savingContactEdit ? (
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  'Save Changes'
                                )}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div
                            key={contact.id}
                            className="px-4 py-3 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">
                                {contact.name[0]}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-white">
                                  {contact.name}
                                </div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider">
                                  {contact.relation}
                                </div>
                                <div className="text-xs text-zinc-500">{contact.phone}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditContact(contact)}
                                className="text-xs text-zinc-500 hover:text-red-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

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
        </motion.div>
      </motion.main>
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        userId={userId || ''}
        onSuccess={handlePaymentSuccess}
        // Personal accounts don't track fleet vehicle count
      />
    </div>
  );
}
