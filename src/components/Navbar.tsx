'use client';

import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 dark:bg-black/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">QRgency</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors dark:text-zinc-400 dark:hover:text-red-500">How it works</Link>
            <Link href="/#pricing" className="text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors dark:text-zinc-400 dark:hover:text-red-500">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors dark:text-zinc-400 dark:hover:text-red-500">Login</Link>
            <Link href="/register" className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20">
              Get Started
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-600 dark:text-zinc-400">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 py-4 px-4 space-y-4">
          <Link href="/#features" onClick={() => setIsOpen(false)} className="block text-base font-medium text-zinc-600 dark:text-zinc-400">How it works</Link>
          <Link href="/#pricing" onClick={() => setIsOpen(false)} className="block text-base font-medium text-zinc-600 dark:text-zinc-400">Pricing</Link>
          <Link href="/login" onClick={() => setIsOpen(false)} className="block text-base font-medium text-zinc-600 dark:text-zinc-400">Login</Link>
          <Link href="/register" onClick={() => setIsOpen(false)} className="block bg-red-600 text-white px-5 py-2 rounded-full text-center text-sm font-semibold">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
