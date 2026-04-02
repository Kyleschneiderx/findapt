import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Users, ArrowRight, Filter } from 'lucide-react';
import { getCityBySlug, getCities, getProviders } from '@/lib/data';
import { deslugify, slugify } from '@/lib/utils';
import { stateRoute, cityRoute, citySpecialtyRoute, providerRoute, stateTelehealthRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProviderCard from '@/components/ProviderCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const cityInfo = await getCityBySlug(citySlug, stateSlug);

  if (!cityInfo) {
    return { title: 'City Not Found | FindaPelvicPT' };
  }

  const stateName = deslugify(stateSlug);
  const title = `Pelvic Floor Physical Therapists in ${cityInfo.city}, ${stateName} | FindaPelvicPT`;
  const description = `Find ${cityInfo.provider_count} pelvic floor physical therapists in ${cityInfo.city}, ${stateName}. Compare specialties, view credentials, and book appointments with local providers.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${cityRoute(stateSlug, citySlug)}`,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${cityRoute(stateSlug, citySlug)}`,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { state: stateSlug, city: citySlug } = await params;

  const [cityInfo, providers, allCities] = await Promise.all([
    getCityBySlug(citySlug, stateSlug),
    getProviders({ city_slug: citySlug, state_slug: stateSlug }),
    getCities(stateSlug),
  ]);

  if (!cityInfo || providers.length === 0) {
    notFound();
  }

  const stateName = deslugify(stateSlug);

  // Collect unique specialties across all providers in this city
  const specialtyMap = new Map<string, number>();
  providers.forEach((provider) => {
    provider.specialties.forEach((s) => {
      specialtyMap.set(s, (specialtyMap.get(s) || 0) + 1);
    });
  });
  const specialties = Array.from(specialtyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, slug: slugify(name), count }));

  // Nearby cities: same state, excluding current, sorted by provider count, top 8
  const nearbyCities = allCities
    .filter((c) => c.city_slug !== citySlug)
    .slice(0, 8);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pelvic Floor Physical Therapists in ${cityInfo.city}, ${stateName}`,
    description: `${providers.length} pelvic floor physical therapists in ${cityInfo.city}, ${stateName}.`,
    url: `${siteUrl}${cityRoute(stateSlug, citySlug)}`,
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
        medicalSpecialty: provider.specialties.join(', '),
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

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-14 sm:pb-18">
          <Breadcrumbs
            items={[
              { label: stateName, href: stateRoute(stateSlug) },
              { label: cityInfo.city },
            ]}
          />

          <AnimatedSection delay={0.1}>
            <div className="mt-6 max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                Pelvic floor therapists in{' '}
                <span className="bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                  {cityInfo.city}
                </span>
                <span className="text-ink-muted font-normal text-2xl sm:text-3xl lg:text-4xl">
                  , {stateName}
                </span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl">
                Compare {providers.length} specialized pelvic floor physical{' '}
                {providers.length === 1 ? 'therapist' : 'therapists'} in {cityInfo.city}. View
                credentials, specialties, and contact information.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                <Users size={16} className="text-rose-400" />
                <span className="font-semibold text-ink">{providers.length}</span>{' '}
                {providers.length === 1 ? 'provider' : 'providers'}
              </span>
              {specialties.length > 0 && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                  <Filter size={16} className="text-mauve-400" />
                  <span className="font-semibold text-ink">{specialties.length}</span> specialties
                </span>
              )}
            </div>
          </AnimatedSection>
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
                  All providers in {cityInfo.city}
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
              {/* Specialties in this city */}
              {specialties.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Specialties in {cityInfo.city}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty) => (
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

              {/* Nearby Cities */}
              {nearbyCities.length > 0 && (
                <AnimatedSection delay={0.25}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Nearby cities in {stateName}
                    </h3>
                    <ul className="space-y-2">
                      {nearbyCities.map((city) => (
                        <li key={city.city_slug}>
                          <Link
                            href={cityRoute(stateSlug, city.city_slug)}
                            className="flex items-center gap-2.5 py-2 px-3 -mx-3 rounded-xl text-ink hover:text-rose-500 hover:bg-rose-50/60 transition-colors group/nearby"
                          >
                            <MapPin
                              size={15}
                              className="text-gold-400 shrink-0 group-hover/nearby:text-rose-400 transition-colors"
                            />
                            <span className="flex-1 font-medium text-sm">{city.city}</span>
                            <span className="text-xs text-ink-muted">
                              {city.provider_count}
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
                      href={stateRoute(stateSlug)}
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
                Pelvic floor physical therapy in {cityInfo.city}, {stateName}
              </h2>
              <div className="mt-5 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  {cityInfo.city} is home to {providers.length} qualified pelvic floor physical{' '}
                  {providers.length === 1 ? 'therapist' : 'therapists'} listed in the FindaPelvicPT
                  directory. These providers specialize in conditions such as pelvic pain, urinary
                  incontinence, pelvic organ prolapse, postpartum recovery, and more.
                </p>
                <p>
                  Pelvic floor physical therapy involves the assessment and treatment of muscles
                  that support the bladder, bowel, and reproductive organs. Treatment approaches
                  used by providers in {cityInfo.city} include manual therapy, biofeedback,
                  therapeutic exercise, electrical stimulation, and patient education tailored to
                  each individual&apos;s needs.
                </p>
                {specialties.length > 0 && (
                  <p>
                    Providers in {cityInfo.city} offer expertise in {specialties.length}{' '}
                    {specialties.length === 1 ? 'specialty' : 'specialties'}, including{' '}
                    {specialties
                      .slice(0, 4)
                      .map((s) => s.name.toLowerCase())
                      .join(', ')}
                    {specialties.length > 4 ? ', and more' : ''}. Whether you need help with a
                    specific condition or are looking for general pelvic health support, you can find
                    a qualified provider above.
                  </p>
                )}
                <p>
                  Can&apos;t find the right fit in {cityInfo.city}? Browse therapists in{' '}
                  <Link
                    href={stateRoute(stateSlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    other {stateName} cities
                  </Link>{' '}
                  or explore providers who offer{' '}
                  <Link
                    href={stateTelehealthRoute(stateSlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    telehealth consultations
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
