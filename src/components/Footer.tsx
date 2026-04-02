import Link from 'next/link';
import { Heart } from 'lucide-react';
import {
  stateRoute,
  cityRoute,
  specialtiesIndexRoute,
  specialtyRoute,
  stateSpecialtiesRoute,
  stateInsuranceRoute,
  stateTelehealthRoute,
  stateSpecialtyRoute,
  citySpecialtyRoute,
} from '@/lib/routes';

const popularCities = [
  { name: 'Los Angeles', slug: 'los-angeles' },
  { name: 'San Francisco', slug: 'san-francisco' },
  { name: 'San Diego', slug: 'san-diego' },
  { name: 'San Jose', slug: 'san-jose' },
  { name: 'Sacramento', slug: 'sacramento' },
  { name: 'Oakland', slug: 'oakland' },
  { name: 'Long Beach', slug: 'long-beach' },
  { name: 'Irvine', slug: 'irvine' },
  { name: 'Santa Monica', slug: 'santa-monica' },
  { name: 'Berkeley', slug: 'berkeley' },
  { name: 'Pasadena', slug: 'pasadena' },
  { name: 'Beverly Hills', slug: 'beverly-hills' },
];

const popularSpecialties = [
  { name: 'Pelvic Pain', slug: 'pelvic-pain' },
  { name: 'Postpartum', slug: 'postpartum' },
  { name: 'Prenatal', slug: 'prenatal' },
  { name: 'Urinary Incontinence', slug: 'urinary-incontinence' },
  { name: 'Pelvic Organ Prolapse', slug: 'pelvic-organ-prolapse' },
  { name: 'Diastasis Recti', slug: 'diastasis-recti' },
  { name: 'Endometriosis', slug: 'endometriosis' },
  { name: "Men's Health", slug: 'mens-health' },
  { name: 'Oncology', slug: 'oncology' },
  { name: 'Pediatric', slug: 'pediatric' },
];

export default function Footer() {
  return (
    <footer className="bg-section-alt border-t border-warm-200 mt-auto">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Main footer grid */}
        <div className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 rotate-3 group-hover:rotate-6 transition-transform duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white" />
                  </svg>
                </div>
              </div>
              <span className="text-base font-bold tracking-tight text-ink">
                Find<span className="text-rose-500">a</span>PelvicPT
              </span>
            </Link>
            <p className="mt-4 text-sm text-ink-muted leading-relaxed max-w-xs">
              Connecting patients with specialized pelvic floor physical therapists.
              Find trusted, qualified providers near you.
            </p>
          </div>

          {/* Cities column */}
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
              Popular Cities
            </h3>
            <ul className="space-y-2.5">
              {popularCities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={cityRoute('california', city.slug)}
                    className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties column */}
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
              Specialties
            </h3>
            <ul className="space-y-2.5">
              {popularSpecialties.map((specialty) => (
                <li key={specialty.slug}>
                  <Link
                    href={specialtyRoute(specialty.slug)}
                    className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline"
                  >
                    {specialty.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/states" className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Browse All Providers
                </Link>
              </li>
              <li>
                <Link href={specialtiesIndexRoute()} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  All Specialties
                </Link>
              </li>
              <li>
                <Link href={stateSpecialtiesRoute('california')} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Specialties in California
                </Link>
              </li>
              <li>
                <Link href={stateInsuranceRoute('california')} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Browse by Insurance
                </Link>
              </li>
              <li>
                <Link href={stateTelehealthRoute('california')} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Telehealth Providers
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  About FindaPelvicPT
                </Link>
              </li>
            </ul>

            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4 mt-8">
              Popular Searches
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href={stateSpecialtyRoute('california', 'postpartum')} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Postpartum PT in CA
                </Link>
              </li>
              <li>
                <Link href={stateSpecialtyRoute('california', 'pelvic-pain')} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Pelvic Pain PT in CA
                </Link>
              </li>
              <li>
                <Link href={citySpecialtyRoute('california', 'los-angeles', 'pelvic-pain')} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Pelvic Pain PT in LA
                </Link>
              </li>
              <li>
                <Link href={citySpecialtyRoute('california', 'san-francisco', 'postpartum')} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                  Postpartum PT in SF
                </Link>
              </li>
            </ul>

            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4 mt-8">
              Top States
            </h3>
            <ul className="space-y-2.5">
              {[
                { name: 'California', slug: 'california' },
                { name: 'New York', slug: 'new-york' },
                { name: 'Texas', slug: 'texas' },
                { name: 'Florida', slug: 'florida' },
                { name: 'Washington', slug: 'washington' },
                { name: 'Illinois', slug: 'illinois' },
                { name: 'Pennsylvania', slug: 'pennsylvania' },
                { name: 'Colorado', slug: 'colorado' },
              ].map((s) => (
                <li key={s.slug}>
                  <Link href={stateRoute(s.slug)} className="text-sm text-ink-muted hover:text-rose-500 transition-colors link-underline">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="divider-warm" />
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-muted">
            &copy; {new Date().getFullYear()} FindaPelvicPT. All rights reserved.
          </p>
          <p className="text-xs text-ink-muted flex items-center gap-1">
            Made with <Heart size={12} className="text-rose-400 fill-rose-400" /> for pelvic health
          </p>
        </div>
      </div>
    </footer>
  );
}
