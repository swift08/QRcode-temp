'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          mobile: mobile,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      try {
        // Kick off OTP verification flow for the provided mobile
        await fetch('/api/auth/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile }),
        });
      } catch (e) {
        // Non-fatal for registration; OTP can be requested again from dashboard
        console.error('Failed to request OTP after registration', e);
      }

      router.push('/dashboard');
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join QRgency to protect yourself and your family">
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Mobile Number</label>
          <input
            type="tel"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
            placeholder="+91 98765 43210"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-red-600 font-bold hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
