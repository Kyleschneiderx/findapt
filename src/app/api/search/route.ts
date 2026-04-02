import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import { cityRoute, specialtyRoute } from '@/lib/routes';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: { type: string; label: string; sublabel?: string; href: string }[] = [];

  // Search providers
  const { data: providers } = await supabase
    .from('providers')
    .select('display_name, practice_name, city, state, slug, city_slug, state_slug')
    .or(`display_name.ilike.%${q}%,practice_name.ilike.%${q}%`)
    .limit(5);

  if (providers) {
    for (const p of providers) {
      results.push({
        type: 'provider',
        label: p.display_name,
        sublabel: [p.practice_name, `${p.city}, ${p.state}`].filter(Boolean).join(' · '),
        href: `/${p.state_slug}/${p.city_slug}/${p.slug}`,
      });
    }
  }

  // Search cities
  const { data: cities } = await supabase
    .from('city_stats')
    .select('city, city_slug, state, state_slug, provider_count')
    .ilike('city', `%${q}%`)
    .order('provider_count', { ascending: false })
    .limit(4);

  if (cities) {
    for (const c of cities) {
      results.push({
        type: 'city',
        label: `${c.city}, ${c.state}`,
        sublabel: `${c.provider_count} provider${c.provider_count !== 1 ? 's' : ''}`,
        href: cityRoute(c.state_slug, c.city_slug),
      });
    }
  }

  // Search specialties
  const specialtyMap: Record<string, string> = {
    'Pelvic Floor Dysfunction': 'pelvic-floor-dysfunction',
    'Pelvic Pain': 'pelvic-pain',
    'Urinary Incontinence': 'urinary-incontinence',
    'Bowel Dysfunction': 'bowel-dysfunction',
    'Postpartum': 'postpartum',
    'Prenatal': 'prenatal',
    'Pelvic Organ Prolapse': 'pelvic-organ-prolapse',
    'Diastasis Recti': 'diastasis-recti',
    'Sexual Health': 'sexual-health',
    'Endometriosis': 'endometriosis',
    'Orthopedic': 'orthopedic',
    'Oncology': 'oncology',
    'Pediatric': 'pediatric',
    "Men's Health": 'mens-health',
    'Telehealth': 'telehealth',
    'Pilates': 'pilates',
    'Manual Therapy': 'manual-therapy',
    'Biofeedback': 'biofeedback',
    'Vaginismus': 'vaginismus',
    'Vulvodynia': 'vulvodynia',
    'Dry Needling': 'dry-needling',
  };

  const matchedSpecialties = Object.entries(specialtyMap)
    .filter(([name]) => name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 3);

  for (const [name, slug] of matchedSpecialties) {
    results.push({
      type: 'specialty',
      label: name,
      sublabel: 'Specialty',
      href: specialtyRoute(slug),
    });
  }

  return NextResponse.json({ results });
}
