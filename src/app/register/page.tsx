'use client';

import * as React from 'react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type PageProps = {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default function RegisterPage(props: PageProps) {
  const searchParams = props.searchParams ? React.use(props.searchParams) : {};
  const segment =
    (searchParams?.segment as string | undefined)?.toLowerCase() === 'commercial'
      ? 'commercial'
      : 'personal';

  if (props.params) React.use(props.params);
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

    // Ensure +91 prefix for Indian mobiles
    let normalizedMobile = mobile.trim();
    // Strip all spaces
    normalizedMobile = normalizedMobile.replace(/\s+/g, '');
    if (!normalizedMobile.startsWith('+91')) {
      // Remove leading 0 if present, then prepend +91
      normalizedMobile = normalizedMobile.replace(/^0+/, '');
      normalizedMobile = `+91${normalizedMobile}`;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          mobile: normalizedMobile,
          account_type: segment,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // OTP verification temporarily disabled after registration
      // After signup, route to dashboard; we can use account_type client-side
      // to show personal vs commercial experience.
      router.push('/dashboard');
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle={
        segment === 'commercial'
          ? 'Set up Kavach for your vehicles and drivers.'
          : 'Join QRgency to protect yourself and your family.'
      }
    >
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
