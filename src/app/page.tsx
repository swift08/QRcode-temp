'use client';

import Navbar from '@/components/Navbar';
import { Shield, Smartphone, QrCode, PhoneCall, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-500/5 blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div {...fadeIn}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold tracking-wider uppercase mb-6">
              <Shield className="w-3 h-3" /> QRgency Emergency System
            </span>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-8">
              Scan. Connect. <span className="text-red-600">Save Lives.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
              Instantly provide your emergency contacts to anyone scanning the QR on your vehicle. Fast, secure, and life-saving when every second counts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto bg-red-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-600/30 flex items-center justify-center gap-2">
                Generate My QR <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/#features" className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Proof */}
      <section className="py-12 border-y border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Setup Time', value: '2 Mins' },
            { label: 'Launch Offer', value: 'Free*' },
            { label: 'Activation', value: 'Instant' },
            { label: 'Security', value: 'Encrypted' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">How it works</h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">Simple process designed for maximum reliability during emergencies.</p>
        </div>

        <motion.div 
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-12"
        >
          {[
            {
              icon: <Smartphone className="w-8 h-8 text-red-600" />,
              title: "1. Register & Setup",
              desc: "Create your account and add up to 3 emergency contacts like family members or friends."
            },
            {
              icon: <QrCode className="w-8 h-8 text-red-600" />,
              title: "2. Generate QR",
              desc: "Activate and download your unique vehicle QR code. Free for the first 1000 customers, then ₹10 one-time."
            },
            {
              icon: <PhoneCall className="w-8 h-8 text-red-600" />,
              title: "3. Scan & Call",
              desc: "In an emergency, anyone can scan the QR to call your contacts immediately without any app."
            }
          ].map((feature, i) => (
            <motion.div key={i} variants={fadeIn} className="p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-red-200 dark:hover:border-red-900 transition-colors bg-white dark:bg-zinc-900/50">
              <div className="mb-6 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 w-fit">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 sm:p-16 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
            <div className="absolute top-8 right-8 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse">
              One-time
            </div>
            <div className="text-center sm:text-left mb-12">
              <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-4">Lifetime Safety</h2>
              <p className="text-zinc-500">
                Simple pricing for a service that can save your life.{' '}
                <span className="font-semibold text-red-600">
                  Free for the first 1000 customers.
                </span>
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-6xl font-black text-zinc-900 dark:text-white">₹10</span>
                  <span className="text-zinc-500">/one-time after first 1000</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Instant Activation', 'Up to 3 Contacts', 'Custom QR Design', 'Lifetime Access', 'No Monthly Fees'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 text-center">
                <QrCode className="w-20 h-20 text-red-600 mx-auto mb-6 opacity-20" />
                <p className="text-sm text-zinc-500 mb-6">Start protecting yourself and your family today.</p>
                <Link href="/register" className="block w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform">
                  Activate Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100 dark:border-zinc-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-red-600" />
          <span className="font-bold text-zinc-900 dark:text-white">QRgency</span>
        </div>
        <p className="text-zinc-500 text-sm">© 2026 QRgency. Scan. Connect. Save Lives.</p>
      </footer>
    </div>
  );
}
