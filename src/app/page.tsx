'use client';

import * as React from 'react';
import Navbar from '@/components/Navbar';
import { Card3D } from '@/components/Card3D';
import { GlassCard } from '@/components/GlassCard';
import { MotionSection, staggerChildVariants } from '@/components/MotionSection';
import { Shield, Smartphone, QrCode, PhoneCall, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const ease = [0.33, 1, 0.68, 1];
const easeBounce = [0.34, 1.56, 0.64, 1];

type HomePageProps = {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default function Home(props: HomePageProps) {
  // Next.js 15: unwrap dynamic APIs so they are not enumerated/accessed by dev tooling
  if (props.params) React.use(props.params);
  if (props.searchParams) React.use(props.searchParams);
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      {/* Hero — uses provided texture image as background */}
      <section className="relative pt-32 md:pt-40 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-textured-hero">
        <div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="space-y-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: easeBounce }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2B3136] border border-[#3A3F45] text-[11px] font-semibold tracking-[0.22em] text-[#B7BEC4]"
            >
              <Shield className="w-4 h-4 text-[#1F7A5A]" /> Kavach · Digital Safety Shield
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28, ease }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.1]"
            >
              Scan. Connect.{' '}
              <span className="block text-[#9AC57A]">
                Save Lives.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38, ease }}
              className="max-w-2xl mx-auto text-base sm:text-lg text-[#D1D7DC] leading-relaxed"
            >
              A high‑trust safety layer that lives on your vehicle. In an emergency, anyone can scan
              your Kavach QR to reach your trusted contacts—securely, even when you can&apos;t use
              your phone.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.48, ease }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Personal / individual CTA */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-md bg-[#0F3D2E] text-white px-8 py-3.5 text-sm md:text-base font-semibold hover:bg-[#145A3A] active:bg-[#1E6F4E] transition-colors"
                >
                  Personal <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>

              {/* Commercial / B2B CTA */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/register?segment=commercial"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-md border border-[#145A3A] text-[#145A3A] px-8 py-3.5 text-sm md:text-base font-semibold hover:bg-[#145A3A] hover:text-white transition-colors"
                >
                  Commercial
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats — simple, high-contrast on dark textured band */}
      <MotionSection
        className="py-16 border-y border-black/60 bg-[#101518]/90"
        stagger
        staggerDelay={0.07}
      >
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Setup Time', value: '2 Mins' },
            { label: 'Launch Offer', value: 'Free*' },
            { label: 'Activation', value: 'Instant' },
            { label: 'Security', value: 'Encrypted' },
          ].map((stat, i) => (
            <motion.div key={i} variants={staggerChildVariants}>
              <GlassCard className="p-6 sm:p-8 text-center bg-[#1E2328] border-none">
                <motion.div
                  className="text-2xl sm:text-3xl font-semibold text-white"
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-[#B7BEC4] mt-2 font-medium">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      {/* Features — Card3D with gradient icon wells */}
      <MotionSection
        id="features"
        className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-y border-black/60 bg-textured-hero"
        stagger
        staggerDelay={0.12}
      >
        <motion.div variants={staggerChildVariants} className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            How it works
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
            Simple process designed for maximum reliability during emergencies.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {[
            {
              icon: <Smartphone className="w-8 h-8 text-white" />,
              title: '1. Register & Setup',
              desc: 'Create your account and add up to 3 emergency contacts like family members or friends.',
            },
            {
              icon: <QrCode className="w-8 h-8 text-white" />,
              title: '2. Generate QR',
              desc: 'Activate and download your unique vehicle QR code. Free for the first 1000 customers, then ₹299 one-time.',
            },
            {
              icon: <PhoneCall className="w-8 h-8 text-white" />,
              title: '3. Scan & Call',
              desc: 'In an emergency, anyone can scan the QR to call your contacts immediately without any app.',
            },
          ].map((feature, i) => (
            <motion.div key={i} variants={staggerChildVariants}>
              <Card3D
                tilt
                lift
                className="p-8 lg:p-10 rounded-[28px] border border-white/5 bg-[#101518]/90 h-full shadow-3d relative overflow-hidden"
              >
                <div
                  className="mb-6 p-4 rounded-2xl w-fit bg-[#0F3D2E] shadow-lg shadow-[#0F3D2E]/30"
                  style={{ transform: 'translateZ(8px)' }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      {/* Pricing — 3D card with glow */}
      <MotionSection
        id="pricing"
        className="py-28 px-4 sm:px-6 lg:px-8 bg-[#101518]/90 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/15 dark:bg-red-500/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-400/10 dark:bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-5xl mx-auto relative space-y-10">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Lifetime Safety</h2>
            <p className="text-zinc-300 text-lg max-w-2xl mx-auto">
              Simple pricing for a service that can save your life.{' '}
              <span className="font-semibold text-red-400">
                Free for the first 1000 customers.
              </span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Individual / personal plan card */}
            <Card3D
              tilt
              lift
              className="bg-white dark:bg-zinc-900 rounded-[30px] p-8 sm:p-10 border border-zinc-200 dark:border-zinc-800 shadow-float relative overflow-hidden ring-2 ring-red-500/10 dark:ring-red-500/20"
            >
              <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/35">
                One-time · Individual
              </div>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-700 dark:text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  For Individuals & Families
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-zinc-900 dark:text-white">
                    ₹299
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                    /one-time after first 1000
                  </span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Instant activation for your vehicle QR',
                    'Up to 3 trusted emergency contacts',
                    'Custom QR design for your number plate or helmet',
                    'Lifetime access to your safety profile',
                    'No subscriptions or hidden monthly fees',
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 text-sm sm:text-base"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3.5 px-6 rounded-2xl font-bold shadow-3d hover:shadow-3d-hover transition-all duration-300 btn-3d"
                  >
                    Activate Individual Plan
                  </Link>
                </motion.div>
              </div>
            </Card3D>

            {/* Commercial / fleet plan card */}
            <Card3D
              tilt
              lift
              className="bg-white/95 dark:bg-zinc-900 rounded-[30px] p-8 sm:p-10 border border-zinc-200 dark:border-zinc-800 shadow-float relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-bold shadow-lg shadow-zinc-900/35">
                Commercial
              </div>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1 text-left">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-600 dark:text-zinc-300">
                      For Commercial, Fleets & Workplaces
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-300">
                      Built for cabs, delivery vehicles, school buses, housing societies and campuses.
                    </p>
                  </div>
                  <div className="inline-flex p-4 rounded-2xl bg-red-100 dark:bg-red-950/50">
                    <QrCode className="w-14 h-14 text-red-600 dark:text-red-500" />
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">Custom pricing</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Volume-based plans depending on number of vehicles or locations.
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {[
                    'Bulk QR generation for fleets and assets',
                    'Configurable contact flows for different teams or sites',
                    'Dashboard-ready structure for future integrations',
                    'Priority onboarding assistance for your organisation',
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-zinc-700 dark:text-zinc-200 text-sm sm:text-base"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register?segment=commercial"
                    className="block w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3.5 rounded-2xl font-bold shadow-3d hover:shadow-3d-hover transition-all duration-300 btn-3d"
                  >
                    Get Commercial Quote
                  </Link>
                </motion.div>
              </div>
            </Card3D>
          </div>
        </div>
      </MotionSection>
    </div>
  );
}
