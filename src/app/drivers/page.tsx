'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  Plus,
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
}

interface FleetDriver {
  id: string;
  owner_profile_id: string;
  name: string;
  phone: string;
  blood_group: string | null;
  notes: string | null;
  assigned_vehicle_id: string | null;
}

export default function DriverManagerPage() {
  const [loading, setLoading] = useState(true);
  const [fleetDrivers, setFleetDrivers] = useState<FleetDriver[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverBloodGroup, setDriverBloodGroup] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [driverSaving, setDriverSaving] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    void fetchDriversAndVehicles();
  }, []);

  const fetchDriversAndVehicles = async () => {
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

      const [{ data: drivers, error: driverError }, { data: vehicles, error: vehicleError }] =
        await Promise.all([
          supabase
            .from('fleet_drivers')
            .select('id, owner_profile_id, name, phone, blood_group, notes, assigned_vehicle_id')
            .eq('owner_profile_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('fleet_vehicles')
            .select('id, owner_profile_id, vehicle_number')
            .eq('owner_profile_id', user.id)
            .order('created_at', { ascending: true }),
        ]);

      if (driverError) {
        console.error('DriverManager: error fetching drivers:', driverError);
      }
      if (vehicleError) {
        console.error('DriverManager: error fetching vehicles:', vehicleError);
      }

      setFleetDrivers(drivers || []);
      setFleetVehicles(vehicles || []);
    } catch (err) {
      console.error('DriverManager: fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
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
          owner_profile_id: user.id,
          name: driverName.trim(),
          phone: driverPhone.trim(),
          blood_group: driverBloodGroup.trim() || null,
          notes: driverNotes.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('DriverManager: failed to create driver:', error);
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
      console.error('DriverManager: create driver error:', err);
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
        console.error('DriverManager: failed to update driver assignment:', error);
        return;
      }

      setFleetDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? (data as FleetDriver) : d))
      );
    } catch (err) {
      console.error('DriverManager: update driver assignment error:', err);
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
        console.error('DriverManager: failed to delete driver:', error);
        return;
      }

      setFleetDrivers((prev) => prev.filter((d) => d.id !== driverId));
    } catch (err) {
      console.error('DriverManager: delete driver error:', err);
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
                Driver Manager
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-red-500">
                B2B · Drivers
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
              Manage all your drivers, their contact information and which vehicle they are assigned
              to.
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
                Drivers
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Add, manage and assign drivers to vehicles
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 active:scale-[0.97] transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Driver</span>
              </button>
            </div>
          </div>

          {fleetDrivers.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 max-h-[420px] overflow-auto">
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
                      {driver.notes && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {driver.notes}
                        </span>
                      )}
                      {assignedVehicle && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Assigned to: {assignedVehicle.vehicle_number}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-red-600 mt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">
              No drivers added yet. Use &quot;Add Driver&quot; to register your first driver.
            </p>
          )}
        </motion.section>
      </motion.main>

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
                  Save driver details and optionally assign them to a vehicle later.
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

