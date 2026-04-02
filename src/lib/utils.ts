export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function deslugify(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getStateFullName(abbr: string): string {
  const states: Record<string, string> = {
    CA: 'California',
    NY: 'New York',
    TX: 'Texas',
    FL: 'Florida',
    IL: 'Illinois',
    PA: 'Pennsylvania',
    OH: 'Ohio',
    GA: 'Georgia',
    NC: 'North Carolina',
    MI: 'Michigan',
    NJ: 'New Jersey',
    VA: 'Virginia',
    WA: 'Washington',
    AZ: 'Arizona',
    MA: 'Massachusetts',
    TN: 'Tennessee',
    IN: 'Indiana',
    MO: 'Missouri',
    MD: 'Maryland',
    WI: 'Wisconsin',
    CO: 'Colorado',
    MN: 'Minnesota',
    SC: 'South Carolina',
    AL: 'Alabama',
    LA: 'Louisiana',
    KY: 'Kentucky',
    OR: 'Oregon',
    OK: 'Oklahoma',
    CT: 'Connecticut',
    UT: 'Utah',
    IA: 'Iowa',
    NV: 'Nevada',
    AR: 'Arkansas',
    MS: 'Mississippi',
    KS: 'Kansas',
    NM: 'New Mexico',
    NE: 'Nebraska',
    ID: 'Idaho',
    WV: 'West Virginia',
    HI: 'Hawaii',
    NH: 'New Hampshire',
    ME: 'Maine',
    MT: 'Montana',
    RI: 'Rhode Island',
    DE: 'Delaware',
    SD: 'South Dakota',
    ND: 'North Dakota',
    AK: 'Alaska',
    VT: 'Vermont',
    WY: 'Wyoming',
    DC: 'District of Columbia',
  };
  return states[abbr.toUpperCase()] || abbr;
}

export function getStateSlug(abbr: string): string {
  return slugify(getStateFullName(abbr));
}

/** Map specialty slugs back to their canonical display names */
const SPECIALTY_SLUG_TO_NAME: Record<string, string> = {
  'pelvic-floor-dysfunction': 'Pelvic Floor Dysfunction',
  'pelvic-pain': 'Pelvic Pain',
  'urinary-incontinence': 'Urinary Incontinence',
  'bowel-dysfunction': 'Bowel Dysfunction',
  'postpartum': 'Postpartum',
  'prenatal': 'Prenatal',
  'pelvic-organ-prolapse': 'Pelvic Organ Prolapse',
  'diastasis-recti': 'Diastasis Recti',
  'sexual-health': 'Sexual Health',
  'endometriosis': 'Endometriosis',
  'orthopedic': 'Orthopedic',
  'oncology': 'Oncology',
  'pediatric': 'Pediatric',
  'mens-health': "Men's Health",
  'telehealth': 'Telehealth',
  'pilates': 'Pilates',
  'manual-therapy': 'Manual Therapy',
  'biofeedback': 'Biofeedback',
  'vaginismus': 'Vaginismus',
  'vulvodynia': 'Vulvodynia',
  'dry-needling': 'Dry Needling',
};

export function specialtySlugToName(slug: string): string | null {
  return SPECIALTY_SLUG_TO_NAME[slug] || null;
}

/** Map insurance slugs back to display names */
const INSURANCE_SLUG_TO_NAME: Record<string, string> = {
  'medi-cal': 'Medi-Cal',
  'medicare': 'Medicare',
  'kaiser': 'Kaiser',
  'aetna': 'Aetna',
  'blue-cross': 'Blue Cross',
  'cigna': 'Cigna',
  'anthem': 'Anthem',
  'health-net': 'Health Net',
  'tricare': 'Tricare',
  'united-healthcare': 'United Healthcare',
};

export function insuranceSlugToName(slug: string): string {
  return INSURANCE_SLUG_TO_NAME[slug] || deslugify(slug);
}
