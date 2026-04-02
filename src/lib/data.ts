import { supabase } from './supabase';
import type { Provider, CityInfo, SpecialtyInfo } from './types';
import { SPECIALTY_META } from './types';

export async function getProviders(options?: {
  city_slug?: string;
  state_slug?: string;
  specialty?: string;
  limit?: number;
  offset?: number;
}): Promise<Provider[]> {
  let query = supabase.from('providers').select('*');

  if (options?.state_slug) {
    query = query.eq('state_slug', options.state_slug);
  }
  if (options?.city_slug) {
    query = query.eq('city_slug', options.city_slug);
  }
  if (options?.specialty) {
    query = query.contains('specialties', [options.specialty]);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  query = query.order('display_name', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data as Provider[];
}

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Provider;
}

export async function getCities(stateSlug?: string): Promise<CityInfo[]> {
  let query = supabase.from('city_stats').select('*');

  if (stateSlug) {
    query = query.eq('state_slug', stateSlug);
  }

  query = query.order('provider_count', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data as CityInfo[];
}

export async function getCityBySlug(citySlug: string, stateSlug: string): Promise<CityInfo | null> {
  const { data, error } = await supabase
    .from('city_stats')
    .select('*')
    .eq('city_slug', citySlug)
    .eq('state_slug', stateSlug)
    .single();

  if (error) return null;
  return data as CityInfo;
}

export async function getSpecialties(): Promise<SpecialtyInfo[]> {
  const { data, error } = await supabase
    .from('specialty_stats')
    .select('*')
    .order('provider_count', { ascending: false });

  if (error) throw error;
  return (data || []).map((s: { name: string; slug: string; provider_count: number }) => ({
    ...s,
    description: SPECIALTY_META[s.slug]?.description || '',
  }));
}

export async function getSpecialtyBySlug(slug: string): Promise<SpecialtyInfo | null> {
  const { data, error } = await supabase
    .from('specialty_stats')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return {
    ...data,
    description: SPECIALTY_META[slug]?.description || '',
  } as SpecialtyInfo;
}

export async function searchProviders(query: string): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .or(
      `display_name.ilike.%${query}%,practice_name.ilike.%${query}%,city.ilike.%${query}%,specialties.cs.{${query}}`
    )
    .limit(20);

  if (error) throw error;
  return data as Provider[];
}

export async function getFeaturedProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .not('bio', 'is', null)
    .not('website', 'is', null)
    .limit(6);

  if (error) throw error;
  return data as Provider[];
}

export async function getStates(): Promise<{ state: string; state_slug: string; provider_count: number; city_count: number }[]> {
  const { data, error } = await supabase
    .from('state_stats')
    .select('*')
    .order('provider_count', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── Tier 1-2: State × Specialty ───

export async function getProvidersForStateSpecialty(
  stateSlug: string,
  specialtyName: string
): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('state_slug', stateSlug)
    .contains('specialties', [specialtyName])
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data as Provider[];
}

// ─── Tier 3: City × Specialty ───

export async function getProvidersForCitySpecialty(
  stateSlug: string,
  citySlug: string,
  specialtyName: string
): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('state_slug', stateSlug)
    .eq('city_slug', citySlug)
    .contains('specialties', [specialtyName])
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data as Provider[];
}

/**
 * Returns city × specialty combos with 2+ providers (for Tier 3 page generation).
 * Groups providers by city and specialty to find viable pages.
 */
export async function getCitySpecialtyCombos(
  stateSlug: string
): Promise<{ city: string; city_slug: string; specialty: string; specialty_slug: string; count: number }[]> {
  const { data: providers, error } = await supabase
    .from('providers')
    .select('city, city_slug, specialties')
    .eq('state_slug', stateSlug);

  if (error) throw error;

  const combos: Record<string, { city: string; city_slug: string; specialty: string; specialty_slug: string; count: number }> = {};

  for (const p of providers || []) {
    for (const spec of p.specialties || []) {
      const slug = spec.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const key = `${p.city_slug}|${slug}`;
      if (!combos[key]) {
        combos[key] = { city: p.city, city_slug: p.city_slug, specialty: spec, specialty_slug: slug, count: 0 };
      }
      combos[key].count++;
    }
  }

  // Only return combos with 2+ providers (thin content filter)
  return Object.values(combos).filter((c) => c.count >= 2);
}

// ─── Tier 4-7: Telehealth ───

export async function getTelehealthProviders(options?: {
  state_slug?: string;
  city_slug?: string;
}): Promise<Provider[]> {
  let query = supabase
    .from('providers')
    .select('*')
    .eq('telehealth_available', true);

  if (options?.state_slug) query = query.eq('state_slug', options.state_slug);
  if (options?.city_slug) query = query.eq('city_slug', options.city_slug);

  query = query.order('display_name', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data as Provider[];
}

// ─── Tier 4-7: Insurance ───

export async function getProvidersByInsurance(
  stateSlug: string,
  citySlug: string,
  insuranceName: string
): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('state_slug', stateSlug)
    .eq('city_slug', citySlug)
    .contains('insurance_accepted', [insuranceName])
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data as Provider[];
}

/**
 * Returns unique insurance types for a city with provider counts.
 * Only returns insurance values that have 2+ providers.
 */
export async function getInsurancesForCity(
  stateSlug: string,
  citySlug: string
): Promise<{ name: string; slug: string; count: number }[]> {
  const { data: providers, error } = await supabase
    .from('providers')
    .select('insurance_accepted')
    .eq('state_slug', stateSlug)
    .eq('city_slug', citySlug);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const p of providers || []) {
    for (const ins of p.insurance_accepted || []) {
      const name = ins.trim();
      if (name && name !== 'Contact for details' && name !== 'Unknown') {
        counts[name] = (counts[name] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Returns all insurance × city combos for a state (for sitemap generation).
 */
export async function getInsuranceCityCombos(
  stateSlug: string
): Promise<{ city_slug: string; insurance_slug: string; insurance_name: string; count: number }[]> {
  const { data: providers, error } = await supabase
    .from('providers')
    .select('city_slug, insurance_accepted')
    .eq('state_slug', stateSlug);

  if (error) throw error;

  const combos: Record<string, { city_slug: string; insurance_slug: string; insurance_name: string; count: number }> = {};

  for (const p of providers || []) {
    for (const ins of p.insurance_accepted || []) {
      const name = ins.trim();
      if (name && name !== 'Contact for details' && name !== 'Unknown') {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const key = `${p.city_slug}|${slug}`;
        if (!combos[key]) {
          combos[key] = { city_slug: p.city_slug, insurance_slug: slug, insurance_name: name, count: 0 };
        }
        combos[key].count++;
      }
    }
  }

  return Object.values(combos).filter((c) => c.count >= 2);
}
