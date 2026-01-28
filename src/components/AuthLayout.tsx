'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="bg-red-600 p-2 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">QRgency</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 sm:rounded-[32px] sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
