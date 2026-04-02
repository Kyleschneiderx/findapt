import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles rewrites run BEFORE filesystem/dynamic route matching
      // This is critical — without it, /state/city/pelvic-floor-physical-therapy
      // would match [state]/[city]/[provider] and 404 because there's no provider
      // with that slug.
      beforeFiles: [
      // ─── State-level keyword pages ───
      // /california/pelvic-floor-physical-therapy → state listing page
      {
        source: '/:state/pelvic-floor-physical-therapy',
        destination: '/:state',
      },
      // /california/pelvic-floor-therapy-specialties → state specialties index
      {
        source: '/:state/pelvic-floor-therapy-specialties',
        destination: '/:state/specialties',
      },
      // /california/telehealth-pelvic-floor-pt → state telehealth
      {
        source: '/:state/telehealth-pelvic-floor-pt',
        destination: '/:state/telehealth',
      },
      // /california/pelvic-floor-pt-insurance → state insurance index
      {
        source: '/:state/pelvic-floor-pt-insurance',
        destination: '/:state/insurance',
      },
      // /california/pelvic-pain-therapy → state × specialty
      // Pattern: any slug ending in -therapy that isn't the main keyword page
      {
        source: '/:state/:specialty-therapy',
        destination: '/:state/specialties/:specialty',
      },

      // ─── City-level keyword pages ───
      // /california/los-angeles/pelvic-floor-physical-therapy → city listing
      {
        source: '/:state/:city/pelvic-floor-physical-therapy',
        destination: '/:state/:city',
      },
      // /california/los-angeles/telehealth-pelvic-floor-pt → city telehealth
      {
        source: '/:state/:city/telehealth-pelvic-floor-pt',
        destination: '/:state/:city/telehealth',
      },
      // /california/los-angeles/pelvic-pain-therapy → city × specialty
      {
        source: '/:state/:city/:specialty-therapy',
        destination: '/:state/:city/specialties/:specialty',
      },
      // /california/los-angeles/medi-cal-pelvic-floor-pt → city × insurance
      {
        source: '/:state/:city/:insurance-pelvic-floor-pt',
        destination: '/:state/:city/insurance/:insurance',
      },

      // ─── Global specialty pages ───
      // /pelvic-floor-therapy-specialties → specialties index
      {
        source: '/pelvic-floor-therapy-specialties',
        destination: '/specialties',
      },
      // /pelvic-pain-physical-therapy → global specialty detail
      {
        source: '/:specialty-physical-therapy',
        destination: '/specialties/:specialty',
      },
    ],
      afterFiles: [],
      fallback: [],
    };
  },

  async redirects() {
    return [
      // ─── 301 redirects from old URLs to new keyword-rich URLs ───

      // State pages
      {
        source: '/:state(california)',
        destination: '/:state/pelvic-floor-physical-therapy',
        permanent: true,
      },

      // State specialties index
      {
        source: '/:state(california)/specialties',
        destination: '/:state/pelvic-floor-therapy-specialties',
        permanent: true,
      },

      // State telehealth
      {
        source: '/:state(california)/telehealth',
        destination: '/:state/telehealth-pelvic-floor-pt',
        permanent: true,
      },

      // State insurance
      {
        source: '/:state(california)/insurance',
        destination: '/:state/pelvic-floor-pt-insurance',
        permanent: true,
      },

      // State × specialty
      {
        source: '/:state(california)/specialties/:specialty',
        destination: '/:state/:specialty-therapy',
        permanent: true,
      },

      // Global specialties index
      {
        source: '/specialties',
        destination: '/pelvic-floor-therapy-specialties',
        permanent: true,
      },

      // Global specialty detail
      {
        source: '/specialties/:specialty',
        destination: '/:specialty-physical-therapy',
        permanent: true,
      },

      // City listing pages
      // NOTE: Can't blanket-redirect /:state/:city because it would catch provider pages too.
      // We handle city redirects in middleware instead.
    ];
  },
};

export default nextConfig;
