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

  // ─── Static Pages ───
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}${specialtiesIndexRoute()}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // ─── Tier 1: State Pages + State-level index pages ───
  const statePages: MetadataRoute.Sitemap = states.flatMap((state) => [
    { url: `${siteUrl}${stateRoute(state.state_slug)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${siteUrl}${stateSpecialtiesRoute(state.state_slug)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${siteUrl}${stateInsuranceRoute(state.state_slug)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
  ]);

  // ─── Tier 2: State × Specialty Pages (all states × all specialties) ───
  const stateSpecialtyPages: MetadataRoute.Sitemap = states.flatMap((state) =>
    specialties.map((specialty) => ({
      url: `${siteUrl}${stateSpecialtyRoute(state.state_slug, specialty.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))
  );

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

  // ─── Tier 3: City × Specialty Combo Pages (2+ providers only, all states) ───
  const allCitySpecialtyCombos = await Promise.all(
    states.map((state) => getCitySpecialtyCombos(state.state_slug))
  );
  const citySpecialtyPages: MetadataRoute.Sitemap = allCitySpecialtyCombos.flatMap((combos, i) =>
    combos.map((combo) => ({
      url: `${siteUrl}${citySpecialtyRoute(states[i].state_slug, combo.city_slug, combo.specialty_slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // ─── Tier 4: Provider Pages ───
  const providerPages: MetadataRoute.Sitemap = providers.map((provider) => ({
    url: `${siteUrl}${providerRoute(provider.state_slug, provider.city_slug, provider.slug)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // ─── Tier 5: Telehealth Pages (all states) ───
  const allTelehealthProviders = await Promise.all(
    states.map((state) => getTelehealthProviders({ state_slug: state.state_slug }))
  );
  const telehealthPages: MetadataRoute.Sitemap = allTelehealthProviders.flatMap((providers, i) => {
    if (providers.length === 0) return [];
    const stateSlug = states[i].state_slug;
    const telehealthCities = new Set(providers.map((p) => p.city_slug));
    return [
      { url: `${siteUrl}${stateTelehealthRoute(stateSlug)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      ...[...telehealthCities].map((citySlug) => ({
        url: `${siteUrl}${cityTelehealthRoute(stateSlug, citySlug)}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ];
  });

  // ─── Tier 6: Insurance × City Pages (2+ providers only, all states) ───
  const allInsuranceCombos = await Promise.all(
    states.map((state) => getInsuranceCityCombos(state.state_slug))
  );
  const insurancePages: MetadataRoute.Sitemap = allInsuranceCombos.flatMap((combos, i) =>
    combos.map((combo) => ({
      url: `${siteUrl}${cityInsuranceRoute(states[i].state_slug, combo.city_slug, combo.insurance_slug)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  );

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
