import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle 301 redirects for city-level pages.
 *
 * We can't use next.config redirects for these because the pattern
 * /:state/:city conflicts with /:state/:provider at the same depth.
 *
 * Instead, we redirect specific old city URLs to their keyword-rich equivalents:
 *   /california/los-angeles → /california/los-angeles/pelvic-floor-physical-therapy
 *   /california/los-angeles/telehealth → /california/los-angeles/telehealth-pelvic-floor-pt
 *   /california/los-angeles/specialties/pelvic-pain → /california/los-angeles/pelvic-pain-therapy
 *   /california/los-angeles/insurance/medi-cal → /california/los-angeles/medi-cal-pelvic-floor-pt
 */

// Known path segments that are NOT cities (to avoid redirecting these)
const NON_CITY_SEGMENTS = new Set([
  'pelvic-floor-physical-therapy',
  'pelvic-floor-therapy-specialties',
  'telehealth-pelvic-floor-pt',
  'pelvic-floor-pt-insurance',
  'specialties',
  'telehealth',
  'insurance',
  'about',
  'api',
]);

// Specialty slugs used to keep the apostrophe as a dash ("women-s-health").
// slugify() now strips it to match the specialty_stats view ("womens-health").
// Google crawled the old spellings, so 301 them to the current slug.
const LEGACY_SPECIALTY_SLUGS: Record<string, string> = {
  'women-s-health': 'womens-health',
  'men-s-pelvic-health': 'mens-pelvic-health',
  'men-s-health': 'mens-health',
};
const LEGACY_SPECIALTY_RE = /^(women-s-health|men-s-pelvic-health|men-s-health)-(therapy|physical-therapy)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  // Skip non-page routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // ─── Legacy apostrophe specialty slugs → current slugs (any depth) ───
  const last = segments[segments.length - 1] || '';
  const legacy = last.match(LEGACY_SPECIALTY_RE);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = `/${[...segments.slice(0, -1), `${LEGACY_SPECIALTY_SLUGS[legacy[1]]}-${legacy[2]}`].join('/')}`;
    return NextResponse.redirect(url, 301);
  }

  // Skip if URL already contains keyword suffixes (already on new URLs)
  if (
    pathname.endsWith('/pelvic-floor-physical-therapy') ||
    pathname.endsWith('-therapy') ||
    pathname.endsWith('-pelvic-floor-pt') ||
    pathname.endsWith('-physical-therapy') ||
    pathname.endsWith('/pelvic-floor-therapy-specialties') ||
    pathname.endsWith('/pelvic-floor-pt-insurance')
  ) {
    return NextResponse.next();
  }

  // ─── /state/city → /state/city/pelvic-floor-physical-therapy ───
  // Pattern: exactly 2 segments, second is not a known non-city segment
  if (segments.length === 2) {
    const [, second] = segments;
    if (!NON_CITY_SEGMENTS.has(second) && !second.endsWith('-therapy') && !second.endsWith('-pelvic-floor-pt') && !second.endsWith('-physical-therapy')) {
      const url = request.nextUrl.clone();
      url.pathname = `${pathname}/pelvic-floor-physical-therapy`;
      return NextResponse.redirect(url, 301);
    }
  }

  // ─── /state/city/telehealth → /state/city/telehealth-pelvic-floor-pt ───
  if (segments.length === 3 && segments[2] === 'telehealth') {
    const url = request.nextUrl.clone();
    url.pathname = `/${segments[0]}/${segments[1]}/telehealth-pelvic-floor-pt`;
    return NextResponse.redirect(url, 301);
  }

  // ─── /state/city/specialties/slug → /state/city/slug-therapy ───
  if (segments.length === 4 && segments[2] === 'specialties') {
    const url = request.nextUrl.clone();
    url.pathname = `/${segments[0]}/${segments[1]}/${segments[3]}-therapy`;
    return NextResponse.redirect(url, 301);
  }

  // ─── /state/city/insurance/slug → /state/city/slug-pelvic-floor-pt ───
  if (segments.length === 4 && segments[2] === 'insurance') {
    const url = request.nextUrl.clone();
    url.pathname = `/${segments[0]}/${segments[1]}/${segments[3]}-pelvic-floor-pt`;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - static files (favicon, images, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next|favicon.ico|.*\\.).*)',
  ],
};
