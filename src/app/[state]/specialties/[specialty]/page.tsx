import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, Users, Sparkles, Filter, Video } from 'lucide-react';
import { getProvidersForStateSpecialty, getCities, getSpecialties } from '@/lib/data';
import { specialtySlugToName, deslugify, slugify } from '@/lib/utils';
import { SPECIALTY_META } from '@/lib/types';
import { stateRoute, stateSpecialtyRoute, stateSpecialtiesRoute, citySpecialtyRoute, specialtyRoute, specialtiesIndexRoute, stateTelehealthRoute, providerRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProviderCard from '@/components/ProviderCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

interface PageProps {
  params: Promise<{ state: string; specialty: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug, specialty: specialtySlug } = await params;
  const specialtyName = specialtySlugToName(specialtySlug);
  if (!specialtyName) return { title: 'Specialty Not Found | FindaPelvicPT' };

  const stateName = deslugify(stateSlug);
  const providers = await getProvidersForStateSpecialty(stateSlug, specialtyName);

  const citySet = new Set(providers.map((p) => p.city));
  const cityCount = citySet.size;

  const title = `${specialtyName} Physical Therapy in ${stateName} | FindaPelvicPT`;
  const description = `Find ${providers.length} ${specialtyName.toLowerCase()} physical therapists across ${stateName}. Browse providers in ${cityCount} cities specializing in ${specialtyName.toLowerCase()} treatment.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}${stateSpecialtyRoute(stateSlug, specialtySlug)}`,
      siteName: 'FindaPelvicPT',
    },
    alternates: {
      canonical: `${siteUrl}${stateSpecialtyRoute(stateSlug, specialtySlug)}`,
    },
  };
}

export default async function StateSpecialtyPage({ params }: PageProps) {
  const { state: stateSlug, specialty: specialtySlug } = await params;
  const specialtyName = specialtySlugToName(specialtySlug);

  if (!specialtyName) notFound();

  const [providers, allSpecialties] = await Promise.all([
    getProvidersForStateSpecialty(stateSlug, specialtyName),
    getSpecialties(),
  ]);

  if (providers.length === 0) notFound();

  const stateName = deslugify(stateSlug);
  const meta = SPECIALTY_META[specialtySlug];

  // Build city breakdown from provider results
  const cityMap = new Map<
    string,
    { city: string; citySlug: string; count: number }
  >();
  for (const p of providers) {
    const existing = cityMap.get(p.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(p.city_slug, {
        city: p.city,
        citySlug: p.city_slug,
        count: 1,
      });
    }
  }
  const cities = Array.from(cityMap.values()).sort(
    (a, b) => b.count - a.count
  );

  // Related specialties (exclude current)
  const relatedSpecialties = allSpecialties
    .filter((s) => s.slug !== specialtySlug)
    .slice(0, 10);

  // Check for telehealth providers
  const telehealthCount = providers.filter(
    (p) => p.telehealth_available
  ).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${specialtyName} Physical Therapists in ${stateName}`,
    description: `${providers.length} ${specialtyName.toLowerCase()} physical therapists across ${stateName}.`,
    url: `${siteUrl}${stateSpecialtyRoute(stateSlug, specialtySlug)}`,
    numberOfItems: providers.length,
    itemListElement: providers.slice(0, 50).map((provider, index) => ({
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
        <div className="petal petal-rose w-[400px] h-[400px] -top-32 -right-40 rotate-12" />
        <div className="petal petal-mauve w-[200px] h-[200px] bottom-0 -left-12 -rotate-12" />
        <div className="petal petal-gold w-[150px] h-[150px] top-1/3 right-1/4 rotate-45" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pb-20">
          <Breadcrumbs
            items={[
              { label: stateName, href: stateRoute(stateSlug) },
              { label: 'Specialties', href: stateSpecialtiesRoute(stateSlug) },
              { label: specialtyName },
            ]}
          />

          <div className="max-w-3xl mt-6">
            <AnimatedSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>State Specialty</span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                {specialtyName} therapists in{' '}
                <span className="bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                  {stateName}
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl">
                {meta?.description ||
                  `Find qualified ${specialtyName.toLowerCase()} specialists across ${stateName}.`}{' '}
                Browse {providers.length}{' '}
                {providers.length === 1 ? 'provider' : 'providers'} in{' '}
                {cities.length} {cities.length === 1 ? 'city' : 'cities'}.
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
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                  <MapPin size={16} className="text-gold-400" />
                  <span className="font-semibold text-ink">
                    {cities.length}
                  </span>{' '}
                  {cities.length === 1 ? 'city' : 'cities'}
                </span>
                {telehealthCount > 0 && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                    <Video size={16} className="text-mauve-400" />
                    <span className="font-semibold text-ink">
                      {telehealthCount}
                    </span>{' '}
                    offer telehealth
                  </span>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── City Breakdown ─── */}
      {cities.length > 0 && (
        <section className="py-12 sm:py-16 bg-section-gradient">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <AnimatedSection>
              <h2 className="text-2xl font-bold text-ink mb-2">
                {specialtyName} by city
              </h2>
              <p className="text-ink-muted mb-8">
                Browse {specialtyName.toLowerCase()} specialists across{' '}
                {stateName} by city.
              </p>
            </AnimatedSection>

            <StaggerContainer
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              staggerDelay={0.04}
            >
              {cities.map((city) => (
                <StaggerItem key={city.citySlug}>
                  <Link
                    href={citySpecialtyRoute(stateSlug, city.citySlug, specialtySlug)}
                    className="card p-5 flex items-center justify-between group/city"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink group-hover/city:text-rose-500 transition-colors truncate">
                        {city.city}
                      </h3>
                      <p className="text-sm text-ink-muted mt-0.5">
                        {city.count}{' '}
                        {city.count === 1 ? 'provider' : 'providers'}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-warm-400 shrink-0 group-hover/city:text-rose-400 group-hover/city:translate-x-0.5 transition-all"
                    />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ─── Provider Listings + Sidebar ─── */}
      <section className="py-12 sm:py-16 bg-section-alt">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
            {/* ─── Provider Listings ─── */}
            <div>
              <AnimatedSection>
                <h2 className="text-2xl font-bold text-ink mb-6">
                  All {specialtyName.toLowerCase()} therapists in {stateName}
                  <span className="text-ink-muted font-normal text-lg ml-2">
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
              {/* Related Specialties */}
              {relatedSpecialties.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Related specialties
                    </h3>
                    <ul className="space-y-2">
                      {relatedSpecialties.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={stateSpecialtyRoute(stateSlug, s.slug)}
                            className="flex items-center justify-between py-1.5 text-sm text-ink-muted hover:text-rose-500 transition-colors group/rel"
                          >
                            <span className="group-hover/rel:translate-x-0.5 transition-transform">
                              {s.name}
                            </span>
                            <ArrowRight
                              size={14}
                              className="text-warm-400 group-hover/rel:text-rose-400 transition-colors"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={specialtiesIndexRoute()}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors group/all"
                    >
                      View all specialties
                      <ArrowRight
                        size={14}
                        className="group-hover/all:translate-x-0.5 transition-transform"
                      />
                    </Link>
                  </div>
                </AnimatedSection>
              )}

              {/* Telehealth Filter */}
              {telehealthCount > 0 && (
                <AnimatedSection delay={0.25}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2">
                      <Video size={18} className="text-mauve-400" />
                      Telehealth available
                    </h3>
                    <p className="text-sm text-ink-muted mb-4">
                      {telehealthCount}{' '}
                      {specialtyName.toLowerCase()} specialist{telehealthCount !== 1 ? 's' : ''}{' '}
                      in {stateName} offer telehealth visits.
                    </p>
                    <Link
                      href={stateTelehealthRoute(stateSlug)}
                      className="btn-secondary text-sm py-2.5 px-5"
                    >
                      <Video size={14} />
                      Browse telehealth providers
                    </Link>
                  </div>
                </AnimatedSection>
              )}

              {/* Top Cities Quick Links */}
              {cities.length > 0 && (
                <AnimatedSection delay={0.35}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-gold-400" />
                      Top cities
                    </h3>
                    <ul className="space-y-2">
                      {cities.slice(0, 8).map((city) => (
                        <li key={city.citySlug}>
                          <Link
                            href={citySpecialtyRoute(stateSlug, city.citySlug, specialtySlug)}
                            className="flex items-center justify-between py-1.5 text-sm text-ink-muted hover:text-rose-500 transition-colors group/city"
                          >
                            <span className="group-hover/city:translate-x-0.5 transition-transform">
                              {city.city}
                            </span>
                            <span className="tag tag-rose text-xs py-0.5 px-2">
                              {city.count}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ─── SEO Content ─── */}
      <section className="py-16 sm:py-20 bg-section-gradient">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection>
            <div className="card p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-ink">
                {specialtyName} physical therapy in {stateName}
              </h2>
              <div className="mt-5 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  {stateName} is home to {providers.length} qualified{' '}
                  {specialtyName.toLowerCase()} physical{' '}
                  {providers.length === 1 ? 'therapist' : 'therapists'} across{' '}
                  {cities.length} {cities.length === 1 ? 'city' : 'cities'}.{' '}
                  {meta?.description ||
                    `These providers specialize in evidence-based ${specialtyName.toLowerCase()} treatment to help patients improve their quality of life.`}
                </p>
                <p>
                  Pelvic floor physical therapists who specialize in{' '}
                  {specialtyName.toLowerCase()} undergo advanced training to
                  provide targeted, individualized care. Treatment approaches may
                  include manual therapy, biofeedback, therapeutic exercise,
                  patient education, and home exercise programs tailored to each
                  patient&apos;s specific needs and goals.
                </p>
                <p>
                  Our directory makes it easy to find a{' '}
                  {specialtyName.toLowerCase()} specialist in {stateName}. Browse
                  the city breakdown above to find providers near you, or scroll
                  through the full listing to compare credentials, practice
                  information, and contact details.
                </p>
                {telehealthCount > 0 && (
                  <p>
                    {telehealthCount}{' '}
                    {specialtyName.toLowerCase()} specialist{telehealthCount !== 1 ? 's' : ''}{' '}
                    in {stateName} also offer{' '}
                    <Link
                      href={stateTelehealthRoute(stateSlug)}
                      className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                    >
                      telehealth consultations
                    </Link>
                    , making it convenient to receive expert care from the
                    comfort of your home.
                  </p>
                )}
                <p>
                  Can&apos;t find the right fit? Browse{' '}
                  <Link
                    href={stateRoute(stateSlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    all providers in {stateName}
                  </Link>{' '}
                  or explore{' '}
                  <Link
                    href={specialtyRoute(specialtySlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    {specialtyName.toLowerCase()} specialists nationwide
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
