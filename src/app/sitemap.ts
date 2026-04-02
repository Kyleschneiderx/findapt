import type { MetadataRoute } from 'next';
import {
  getSpecialties,
  getCities,
  getProviders,
  getStates,
  getCitySpecialtyCombos,
  getTelehealthProviders,
  getInsuranceCityCombos,
} from '@/lib/data';
import {
  stateRoute,
  stateSpecialtiesRoute,
  stateInsuranceRoute,
  stateSpecialtyRoute,
  stateTelehealthRoute,
  cityRoute,
  citySpecialtyRoute,
  cityTelehealthRoute,
  cityInsuranceRoute,
  providerRoute,
  specialtiesIndexRoute,
  specialtyRoute,
} from '@/lib/routes';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [specialties, states, cities, providers] = await Promise.all([
    getSpecialties(),
    getStates(),
    getCities(),
    getProviders(),
  ]);

  // Fetch tier 2-7 data per state
  const stateSlug = 'california'; // expand this loop when adding more states
  const [citySpecialtyCombos, telehealthProviders, insuranceCombos] = await Promise.all([
    getCitySpecialtyCombos(stateSlug),
    getTelehealthProviders({ state_slug: stateSlug }),
    getInsuranceCityCombos(stateSlug),
  ]);

  // ─── Static Pages ───
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}${specialtiesIndexRoute()}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}${stateSpecialtiesRoute(stateSlug)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}${stateInsuranceRoute(stateSlug)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // ─── Tier 1: State Pages ───
  const statePages: MetadataRoute.Sitemap = states.map((state) => ({
    url: `${siteUrl}${stateRoute(state.state_slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // ─── Tier 2: State × Specialty Pages ───
  const stateSpecialtyPages: MetadataRoute.Sitemap = specialties.map((specialty) => ({
    url: `${siteUrl}${stateSpecialtyRoute(stateSlug, specialty.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // ─── Tier 2: City Pages ───
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${siteUrl}${cityRoute(city.state_slug, city.city_slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ─── Tier 2: Global Specialty Pages ───
  const specialtyPages: MetadataRoute.Sitemap = specialties.map((specialty) => ({
    url: `${siteUrl}${specialtyRoute(specialty.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ─── Tier 3: City × Specialty Combo Pages (2+ providers only) ───
  const citySpecialtyPages: MetadataRoute.Sitemap = citySpecialtyCombos.map((combo) => ({
    url: `${siteUrl}${citySpecialtyRoute(stateSlug, combo.city_slug, combo.specialty_slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // ─── Tier 4: Provider Pages ───
  const providerPages: MetadataRoute.Sitemap = providers.map((provider) => ({
    url: `${siteUrl}${providerRoute(provider.state_slug, provider.city_slug, provider.slug)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // ─── Tier 5: Telehealth Pages ───
  const telehealthCities = new Set(telehealthProviders.map((p) => p.city_slug));
  const telehealthPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}${stateTelehealthRoute(stateSlug)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    ...[...telehealthCities].map((citySlug) => ({
      url: `${siteUrl}${cityTelehealthRoute(stateSlug, citySlug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  // ─── Tier 6: Insurance × City Pages (2+ providers only) ───
  const insurancePages: MetadataRoute.Sitemap = insuranceCombos.map((combo) => ({
    url: `${siteUrl}${cityInsuranceRoute(stateSlug, combo.city_slug, combo.insurance_slug)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...statePages,
    ...stateSpecialtyPages,
    ...cityPages,
    ...specialtyPages,
    ...citySpecialtyPages,
    ...providerPages,
    ...telehealthPages,
    ...insurancePages,
  ];
}
