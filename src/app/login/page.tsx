'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to manage your QRgency account">
      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Email address</label>
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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Password</label>
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
          className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-red-600 font-bold hover:underline">
            Register now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
