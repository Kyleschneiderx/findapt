import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, Users, Sparkles, Shield, Video } from 'lucide-react';
import { getProvidersForCitySpecialty, getCityBySlug, getProviders, getProvidersForStateSpecialty } from '@/lib/data';
import { specialtySlugToName, deslugify, slugify } from '@/lib/utils';
import { SPECIALTY_META } from '@/lib/types';
import { stateRoute, cityRoute, stateSpecialtyRoute, citySpecialtyRoute, providerRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProviderCard from '@/components/ProviderCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

interface PageProps {
  params: Promise<{ state: string; city: string; specialty: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, specialty: specialtySlug } = await params;
  const specialtyName = specialtySlugToName(specialtySlug);
  if (!specialtyName) return { title: 'Not Found | FindaPelvicPT' };

  const cityInfo = await getCityBySlug(citySlug, stateSlug);
  if (!cityInfo) return { title: 'City Not Found | FindaPelvicPT' };

  const stateName = deslugify(stateSlug);
  const providers = await getProvidersForCitySpecialty(stateSlug, citySlug, specialtyName);

  const title = `${specialtyName} Physical Therapy in ${cityInfo.city}, ${stateName} | FindaPelvicPT`;
  const description = `Find ${providers.length} ${specialtyName.toLowerCase()} specialists in ${cityInfo.city}, ${stateName}. Compare providers, view credentials, and book appointments.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}${citySpecialtyRoute(stateSlug, citySlug, specialtySlug)}`,
      siteName: 'FindaPelvicPT',
    },
    alternates: {
      canonical: `${siteUrl}${citySpecialtyRoute(stateSlug, citySlug, specialtySlug)}`,
    },
  };
}

export default async function CitySpecialtyPage({ params }: PageProps) {
  const { state: stateSlug, city: citySlug, specialty: specialtySlug } = await params;
  const specialtyName = specialtySlugToName(specialtySlug);

  if (!specialtyName) notFound();

  const [providers, cityInfo, allCityProviders, stateSpecialtyProviders] =
    await Promise.all([
      getProvidersForCitySpecialty(stateSlug, citySlug, specialtyName),
      getCityBySlug(citySlug, stateSlug),
      getProviders({ city_slug: citySlug, state_slug: stateSlug }),
      getProvidersForStateSpecialty(stateSlug, specialtyName),
    ]);

  // Require 2+ providers for thin content filter
  if (!cityInfo || providers.length < 2) {
    notFound();
  }

  const stateName = deslugify(stateSlug);
  const meta = SPECIALTY_META[specialtySlug];

  // Sidebar: other specialties in this city (with provider counts)
  const specialtyMap = new Map<string, number>();
  allCityProviders.forEach((provider) => {
    provider.specialties.forEach((s) => {
      specialtyMap.set(s, (specialtyMap.get(s) || 0) + 1);
    });
  });
  const otherSpecialties = Array.from(specialtyMap.entries())
    .filter(([name]) => name !== specialtyName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, slug: slugify(name), count }));

  // Sidebar: other cities with this specialty in this state
  const otherCityMap = new Map<
    string,
    { city: string; citySlug: string; count: number }
  >();
  for (const p of stateSpecialtyProviders) {
    if (p.city_slug === citySlug) continue;
    const existing = otherCityMap.get(p.city_slug);
    if (existing) {
      existing.count++;
    } else {
      otherCityMap.set(p.city_slug, {
        city: p.city,
        citySlug: p.city_slug,
        count: 1,
      });
    }
  }
  const otherCities = Array.from(otherCityMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Sidebar: insurance types available for this specialty in this city
  const insuranceMap = new Map<string, number>();
  providers.forEach((provider) => {
    provider.insurance_accepted.forEach((ins) => {
      const name = ins.trim();
      if (name && name !== 'Contact for details' && name !== 'Unknown') {
        insuranceMap.set(name, (insuranceMap.get(name) || 0) + 1);
      }
    });
  });
  const insuranceTypes = Array.from(insuranceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, slug: slugify(name), count }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${specialtyName} Physical Therapists in ${cityInfo.city}, ${stateName}`,
    description: `${providers.length} ${specialtyName.toLowerCase()} specialists in ${cityInfo.city}, ${stateName}.`,
    url: `${siteUrl}${citySpecialtyRoute(stateSlug, citySlug, specialtySlug)}`,
    numberOfItems: providers.length,
    itemListElement: providers.map((provider, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MedicalBusiness',
        name: provider.display_name,
        url: `${siteUrl}${providerRoute(provider.state_slug, provider.city_slug, provider.slug)}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: provider.city,
          addressRegion: provider.state,
          ...(provider.zip ? { postalCode: provider.zip } : {}),
          ...(provider.address ? { streetAddress: provider.address } : {}),
        },
        ...(provider.phone ? { telephone: provider.phone } : {}),
        ...(provider.website ? { url: provider.website } : {}),
        medicalSpecialty: specialtyName,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Hero Section ─── */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="petal petal-rose w-[350px] h-[350px] -top-28 -right-28 rotate-12" />
        <div className="petal petal-mauve w-[200px] h-[200px] bottom-0 -left-12 -rotate-12" />
        <div className="petal petal-gold w-[150px] h-[150px] top-1/3 right-1/4 rotate-45" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-14 sm:pb-18">
          <Breadcrumbs
            items={[
              { label: stateName, href: stateRoute(stateSlug) },
              { label: cityInfo.city, href: cityRoute(stateSlug, citySlug) },
              { label: 'Specialties', href: stateSpecialtyRoute(stateSlug, specialtySlug) },
              { label: specialtyName },
            ]}
          />

          <div className="max-w-3xl mt-6">
            <AnimatedSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>{specialtyName}</span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                {specialtyName} therapists in{' '}
                <span className="bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                  {cityInfo.city}
                </span>
                <span className="text-ink-muted font-normal text-2xl sm:text-3xl lg:text-4xl">
                  , {stateName}
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl">
                Compare {providers.length} specialized{' '}
                {specialtyName.toLowerCase()}{' '}
                {providers.length === 1 ? 'therapist' : 'therapists'} in{' '}
                {cityInfo.city}. View credentials, specialties, and contact
                information.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                  <Users size={16} className="text-rose-400" />
                  <span className="font-semibold text-ink">
                    {providers.length}
                  </span>{' '}
                  {providers.length === 1 ? 'provider' : 'providers'}
                </span>
                {insuranceTypes.length > 0 && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                    <Shield size={16} className="text-mauve-400" />
                    <span className="font-semibold text-ink">
                      {insuranceTypes.length}
                    </span>{' '}
                    insurance types
                  </span>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <section className="py-12 sm:py-16 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
            {/* ─── Provider Listings ─── */}
            <div>
              <AnimatedSection>
                <h2 className="text-xl font-bold text-ink mb-6">
                  {specialtyName} providers in {cityInfo.city}
                  <span className="text-ink-muted font-normal text-base ml-2">
                    ({providers.length})
                  </span>
                </h2>
              </AnimatedSection>

              <StaggerContainer className="space-y-5" staggerDelay={0.06}>
                {providers.map((provider, i) => (
                  <StaggerItem key={provider.slug}>
                    <ProviderCard provider={provider} index={i} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>

            {/* ─── Sidebar ─── */}
            <aside className="mt-12 lg:mt-0 space-y-8">
              {/* Other specialties in this city */}
              {otherSpecialties.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Other specialties in {cityInfo.city}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {otherSpecialties.map((specialty) => (
                        <Link
                          key={specialty.slug}
                          href={citySpecialtyRoute(stateSlug, citySlug, specialty.slug)}
                          className="tag tag-rose hover:bg-rose-100 transition-colors"
                        >
                          {specialty.name}
                          <span className="text-rose-400 text-xs ml-1">
                            {specialty.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* Other cities with this specialty */}
              {otherCities.length > 0 && (
                <AnimatedSection delay={0.25}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-gold-400" />
                      Nearby {specialtyName.toLowerCase()} providers
                    </h3>
                    <ul className="space-y-2">
                      {otherCities.map((city) => (
                        <li key={city.citySlug}>
                          <Link
                            href={citySpecialtyRoute(stateSlug, city.citySlug, specialtySlug)}
                            className="flex items-center gap-2.5 py-2 px-3 -mx-3 rounded-xl text-ink hover:text-rose-500 hover:bg-rose-50/60 transition-colors group/nearby"
                          >
                            <MapPin
                              size={15}
                              className="text-gold-400 shrink-0 group-hover/nearby:text-rose-400 transition-colors"
                            />
                            <span className="flex-1 font-medium text-sm">
                              {city.city}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {city.count}
                            </span>
                            <ArrowRight
                              size={14}
                              className="text-warm-400 opacity-0 group-hover/nearby:opacity-100 transition-opacity"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={stateSpecialtyRoute(stateSlug, specialtySlug)}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors group/all"
                    >
                      View all {stateName} cities
                      <ArrowRight
                        size={14}
                        className="group-hover/all:translate-x-0.5 transition-transform"
                      />
                    </Link>
                  </div>
                </AnimatedSection>
              )}

              {/* Insurance types */}
              {insuranceTypes.length > 0 && (
                <AnimatedSection delay={0.35}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-mauve-400" />
                      Insurance accepted
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {insuranceTypes.map((ins) => (
                        <span
                          key={ins.slug}
                          className="tag tag-mauve"
                        >
                          {ins.name}
                          <span className="text-mauve-400 text-xs ml-1">
                            {ins.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ─── SEO Content ─── */}
      <section className="py-16 sm:py-20 bg-section-alt">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection>
            <div className="card p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-ink">
                {specialtyName} physical therapy in {cityInfo.city},{' '}
                {stateName}
              </h2>
              <div className="mt-5 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  {cityInfo.city} has {providers.length} qualified{' '}
                  {specialtyName.toLowerCase()} physical{' '}
                  {providers.length === 1 ? 'therapist' : 'therapists'} listed
                  in the FindaPelvicPT directory.{' '}
                  {meta?.description ||
                    `These providers specialize in evidence-based ${specialtyName.toLowerCase()} treatment.`}
                </p>
                <p>
                  Pelvic floor physical therapists specializing in{' '}
                  {specialtyName.toLowerCase()} use a range of techniques
                  including manual therapy, therapeutic exercise, biofeedback,
                  and patient education. Each provider in {cityInfo.city} creates
                  individualized treatment plans based on thorough assessment of
                  your specific needs and goals.
                </p>
                {otherSpecialties.length > 0 && (
                  <p>
                    Providers in {cityInfo.city} also offer expertise in other
                    specialties, including{' '}
                    {otherSpecialties
                      .slice(0, 4)
                      .map((s) => s.name.toLowerCase())
                      .join(', ')}
                    {otherSpecialties.length > 4 ? ', and more' : ''}. Whether
                    you need help with {specialtyName.toLowerCase()} or a
                    related condition, you can find a qualified provider above.
                  </p>
                )}
                <p>
                  Can&apos;t find the right fit in {cityInfo.city}? Browse{' '}
                  <Link
                    href={stateSpecialtyRoute(stateSlug, specialtySlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    {specialtyName.toLowerCase()} specialists across {stateName}
                  </Link>{' '}
                  or explore{' '}
                  <Link
                    href={cityRoute(stateSlug, citySlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    all providers in {cityInfo.city}
                  </Link>
                  .
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
