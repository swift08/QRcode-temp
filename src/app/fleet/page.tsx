'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  Plus,
  QrCode,
  Download,
  Loader2,
  User,
  X,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card3D } from '@/components/Card3D';

interface FleetVehicle {
  id: string;
  owner_profile_id: string;
  vehicle_number: string;
  label: string | null;
  make_model: string | null;
  qr_token?: string | null;
  created_at: string;
}

export default function FleetManagerPage() {
  const [loading, setLoading] = useState(true);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    void fetchFleet();
  }, []);

  const fetchFleet = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setProfileName(
        (user.user_metadata?.full_name as string | undefined) || 'Fleet owner'
      );

      const accountType =
        (user.user_metadata?.account_type as 'personal' | 'commercial' | undefined) ??
        'personal';

      if (accountType !== 'commercial') {
        // Non-fleet users are redirected back to the main dashboard
        router.push('/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select(
          'id, owner_profile_id, vehicle_number, label, make_model, qr_token, created_at'
        )
        .eq('owner_profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('FleetManager: error fetching vehicles:', error);
      }

      setFleetVehicles(data || []);
    } catch (err) {
      console.error('FleetManager: fetchFleet error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setVehicleError('Profile not loaded. Please refresh the page.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setVehicleError('Vehicle number is required.');
      return;
    }

    setVehicleSaving(true);
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .insert({
          owner_profile_id: user.id,
          vehicle_number: vehicleNumber.trim(),
          label: vehicleLabel.trim() || null,
          make_model: vehicleMakeModel.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('FleetManager: failed to create fleet vehicle:', error);
        setVehicleError(error.message ?? 'Failed to save vehicle.');
        return;
      }

      setFleetVehicles((prev) => [data as FleetVehicle, ...prev]);

      // Clear form and close modal
      setVehicleNumber('');
      setVehicleLabel('');
      setVehicleMakeModel('');
      setIsVehicleModalOpen(false);
    } catch (err) {
      console.error('FleetManager: create vehicle error:', err);
      setVehicleError(
        err instanceof Error ? err.message : 'Something went wrong while saving vehicle.'
      );
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleGenerateVehicleQr = async (vehicleId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        console.error('FleetManager: generateVehicleQr: no active session');
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
        console.error('FleetManager: failed to generate vehicle QR:', data.error);
        return;
      }
      if (!data.token) return;

      setFleetVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, qr_token: data.token } : v))
      );
    } catch (err) {
      console.error('FleetManager: generateVehicleQr client error:', err);
    }
  };

  const handleDownloadVehicleQr = async (token: string) => {
    try {
      const res = await fetch(`/api/qr/${token}`);
      if (!res.ok) {
        console.error('FleetManager: vehicle QR download API error', await res.text());
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
      console.error('FleetManager: failed to download vehicle QR:', err);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        'Are you sure you would like to delete this vehicle? This will also remove its QR from your fleet list.'
      );
      if (!ok) return;
    }

    try {
      const { error } = await supabase.from('fleet_vehicles').delete().eq('id', vehicleId);
      if (error) {
        console.error('FleetManager: failed to delete fleet vehicle:', error);
        return;
      }

      setFleetVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch (err) {
      console.error('FleetManager: delete vehicle error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] },
    },
  };

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
              <span className="font-bold text-zinc-900 dark:text-white">
                Fleet Vehicle Manager
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-red-500">
                B2B · Vehicles
              </span>
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
                    router.push('/dashboard');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Shield className="w-4 h-4" />
                  <span>Back to dashboard</span>
                </button>
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
              Welcome, {profileName}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Manage all your fleet vehicles, generate QR codes, and download stickers from a single
              place.
            </p>
          </Card3D>
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
                Fleet Vehicles
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Add, manage and download QR codes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 active:scale-[0.97] transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>

          {fleetVehicles.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 max-h-[420px] overflow-auto">
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
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-red-600 mt-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">
              No vehicles added yet. Use &quot;Add Vehicle&quot; to register your first vehicle.
            </p>
          )}
        </motion.section>
      </motion.main>

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
                  Save your vehicle details first, then generate its QR.
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
              <div className="mb-3 text-xs text-red-600 dark:text-red-400">{vehicleError}</div>
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
    </div>
  );
}

