'use client';

import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navEase = { ease: [0.33, 1, 0.68, 1] };

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ...navEase }}
      className="sticky top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-lg border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[4.25rem] items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                className="bg-[#0A2A1F] p-1.5 rounded-xl"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ...navEase }}
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-semibold tracking-tight text-white group-hover:text-[#E6ECEF] transition-colors duration-200">
                kavach
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '/#features', label: 'How it works' },
              { href: '/#pricing', label: 'Pricing' },
              { href: '/about', label: 'About Us' },
              { href: '/login', label: 'Login' },
            ].map((item) => (
              <motion.div key={item.href} whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-[#B7BEC4] hover:text-[#145A3A] transition-colors"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ...navEase }}
            >
              <Link
                href="/#pricing"
                className="inline-block rounded-md bg-[#0A2A1F] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#145A3A] active:bg-[#1E6F4E] transition-colors"
              >
                Get Your Kavach
              </Link>
            </motion.div>
          </div>

          <div className="md:hidden flex items-center">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#E6ECEF] p-2 -m-2 rounded-lg hover:bg-[#2B3136]"
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.15 }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ...navEase }}
            className="md:hidden overflow-hidden bg-[#1F2428] border-b border-[#2B3136]"
          >
            <div className="py-4 px-4 space-y-1">
              {[
                { href: '/#features', label: 'How it works' },
                { href: '/#pricing', label: 'Pricing' },
                { href: '/about', label: 'About Us' },
                { href: '/login', label: 'Login' },
              ].map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.2, ...navEase }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 px-3 rounded-xl text-base font-medium text-[#B7BEC4] hover:bg-[#2B3136] hover:text-[#145A3A] transition-colors"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.2, ...navEase }}
                className="pt-2"
              >
                <Link
                  href="/#pricing"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-[#0A2A1F] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#145A3A] active:bg-[#1E6F4E] transition-colors"
                >
                  Get Your Kavach
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
