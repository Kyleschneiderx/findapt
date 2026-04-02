export interface Provider {
  id: string;
  provider_name: string;
  display_name: string;
  credentials: string | null;
  title: string | null;
  practice_name: string | null;
  bio: string | null;
  specialties: string[];
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  linkedin_url: string | null;
  telehealth_available: boolean;
  insurance_accepted: string[];
  languages: string[];
  education: string | null;
  slug: string;
  city_slug: string;
  state_slug: string;
}

export interface CityInfo {
  city: string;
  city_slug: string;
  state: string;
  state_slug: string;
  provider_count: number;
}

export interface SpecialtyInfo {
  name: string;
  slug: string;
  provider_count: number;
  description: string;
}

export const SPECIALTY_META: Record<string, { description: string; icon: string }> = {
  'pelvic-floor-dysfunction': {
    description: 'Treatment for pelvic floor muscle issues including weakness, tightness, and coordination problems.',
    icon: 'Heart',
  },
  'pelvic-pain': {
    description: 'Specialized care for chronic or acute pelvic pain conditions.',
    icon: 'Shield',
  },
  'urinary-incontinence': {
    description: 'Therapy for bladder control issues including stress and urge incontinence.',
    icon: 'Droplets',
  },
  'bowel-dysfunction': {
    description: 'Treatment for bowel control problems including constipation and fecal incontinence.',
    icon: 'Activity',
  },
  'postpartum': {
    description: 'Recovery support after childbirth including core rehabilitation and pelvic floor restoration.',
    icon: 'Baby',
  },
  'prenatal': {
    description: 'Physical therapy during pregnancy to address pain, prepare for delivery, and maintain wellness.',
    icon: 'Flower2',
  },
  'pelvic-organ-prolapse': {
    description: 'Conservative management of pelvic organ prolapse through strengthening and lifestyle modification.',
    icon: 'ArrowUpCircle',
  },
  'diastasis-recti': {
    description: 'Treatment for abdominal separation commonly occurring during and after pregnancy.',
    icon: 'Layers',
  },
  'sexual-health': {
    description: 'Therapy addressing sexual dysfunction including pain during intercourse and arousal disorders.',
    icon: 'HeartPulse',
  },
  'endometriosis': {
    description: 'Physical therapy management of endometriosis-related pain and dysfunction.',
    icon: 'Flower',
  },
  'orthopedic': {
    description: 'Musculoskeletal treatment addressing joint, muscle, and movement-related conditions.',
    icon: 'Bone',
  },
  'oncology': {
    description: 'Rehabilitation for patients undergoing or recovering from cancer treatment.',
    icon: 'Ribbon',
  },
  'pediatric': {
    description: 'Pelvic floor therapy tailored for children and adolescents.',
    icon: 'Users',
  },
  'mens-health': {
    description: 'Pelvic floor therapy for men including post-prostatectomy rehabilitation.',
    icon: 'UserCheck',
  },
  'telehealth': {
    description: 'Remote pelvic floor therapy sessions via video consultation.',
    icon: 'Video',
  },
  'pilates': {
    description: 'Pilates-based rehabilitation for core strength and pelvic floor coordination.',
    icon: 'Dumbbell',
  },
  'manual-therapy': {
    description: 'Hands-on techniques including soft tissue mobilization and myofascial release.',
    icon: 'Hand',
  },
  'biofeedback': {
    description: 'Technology-assisted therapy using real-time feedback to improve pelvic floor muscle control.',
    icon: 'MonitorSmartphone',
  },
  'vaginismus': {
    description: 'Specialized treatment for involuntary vaginal muscle spasms causing pain or penetration difficulty.',
    icon: 'ShieldCheck',
  },
  'vulvodynia': {
    description: 'Therapy for chronic vulvar pain conditions.',
    icon: 'ShieldHalf',
  },
  'dry-needling': {
    description: 'Trigger point dry needling to release muscle tension and reduce pelvic pain.',
    icon: 'Crosshair',
  },
};
