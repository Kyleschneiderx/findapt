'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import SearchBar from './SearchBar';
import { stateRoute, specialtiesIndexRoute } from '@/lib/routes';

const navLinks = [
  { label: 'Find a Therapist', href: stateRoute('california') },
  { label: 'Specialties', href: specialtiesIndexRoute() },
  { label: 'About', href: '/about' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`
          fixed top-0 left-0 right-0 z-40 transition-all duration-500
          ${scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-[var(--shadow-nav)] border-b border-warm-200/50'
            : 'bg-transparent'
          }
        `}
      >
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 rotate-3 group-hover:rotate-6 transition-transform duration-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white" />
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">
              Find<span className="text-rose-500">a</span>PelvicPT
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-ink-light hover:text-rose-500 rounded-lg hover:bg-rose-50/60 transition-all duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop search */}
          <div className="hidden md:block flex-1 max-w-md ml-auto">
            <SearchBar variant="nav" placeholder="Search providers, cities..." />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden ml-auto p-2 -mr-2 text-ink-light hover:text-ink transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl lg:hidden"
            >
              <div className="p-6 pt-24 flex flex-col h-full">
                {/* Mobile search */}
                <div className="mb-8">
                  <SearchBar variant="hero" placeholder="Search..." />
                </div>

                {/* Mobile links */}
                <nav className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-4 py-4 text-lg font-medium text-ink hover:text-rose-500 rounded-xl hover:bg-rose-50/60 transition-all"
                      >
                        {link.label}
                        <ChevronRight size={18} className="text-ink-muted" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile CTA */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mt-auto pb-8"
                >
                  <Link
                    href={stateRoute('california')}
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    <span>Browse All Providers</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />
    </>
  );
}
