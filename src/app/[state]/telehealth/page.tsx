import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Video, Users, MapPin, ArrowRight, Filter } from 'lucide-react';
import { getTelehealthProviders, getStates } from '@/lib/data';
import { deslugify, slugify } from '@/lib/utils';
import { stateRoute, cityTelehealthRoute, specialtyRoute, stateTelehealthRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProviderCard from '@/components/ProviderCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

interface StateTelehealthPageProps {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: StateTelehealthPageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateName = deslugify(stateSlug);

  const title = `Telehealth Pelvic Floor Physical Therapy in ${stateName} | FindaPelvicPT`;
  const description = `Find pelvic floor physical therapists offering telehealth appointments in ${stateName}. Compare providers, view specialties, and book virtual consultations.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${stateTelehealthRoute(stateSlug)}`,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${stateTelehealthRoute(stateSlug)}`,
    },
  };
}

export default async function StateTelehealthPage({ params }: StateTelehealthPageProps) {
  const { state: stateSlug } = await params;

  const providers = await getTelehealthProviders({ state_slug: stateSlug });

  if (providers.length === 0) {
    notFound();
  }

  const stateName = deslugify(stateSlug);

  // Extract cities with telehealth providers
  const cityMap = new Map<string, { city: string; city_slug: string; count: number }>();
  providers.forEach((provider) => {
    const existing = cityMap.get(provider.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(provider.city_slug, {
        city: provider.city,
        city_slug: provider.city_slug,
        count: 1,
      });
    }
  });
  const cities = Array.from(cityMap.values()).sort((a, b) => b.count - a.count);

  // Collect specialty breakdown
  const specialtyMap = new Map<string, number>();
  providers.forEach((provider) => {
    provider.specialties.forEach((s) => {
      specialtyMap.set(s, (specialtyMap.get(s) || 0) + 1);
    });
  });
  const specialties = Array.from(specialtyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, slug: slugify(name), count }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Telehealth Pelvic Floor Physical Therapists in ${stateName}`,
    description: `${providers.length} pelvic floor physical therapists offering telehealth in ${stateName}.`,
    url: `${siteUrl}${stateTelehealthRoute(stateSlug)}`,
    numberOfItems: providers.length,
    itemListElement: providers.map((provider, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MedicalBusiness',
        name: provider.display_name,
        url: `${siteUrl}/${provider.state_slug}/${provider.city_slug}/${provider.slug}`,
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
        availableService: {
          '@type': 'MedicalTherapy',
          name: 'Telehealth Pelvic Floor Physical Therapy',
          serviceType: 'Telehealth',
        },
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
        <div className="petal petal-gold w-[350px] h-[350px] -top-28 -right-28 rotate-12" />
        <div className="petal petal-rose w-[200px] h-[200px] bottom-0 -left-12 -rotate-12" />
        <div className="petal petal-mauve w-[150px] h-[150px] top-1/3 right-1/4 rotate-45" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-14 sm:pb-18">
          <Breadcrumbs
            items={[
              { label: stateName, href: stateRoute(stateSlug) },
              { label: 'Telehealth' },
            ]}
          />

          <AnimatedSection delay={0.1}>
            <div className="mt-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-50 border border-gold-200 text-gold-600 text-sm font-medium mb-4">
                <Video size={16} />
                Virtual appointments available
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                Telehealth pelvic floor therapy in{' '}
                <span className="bg-gradient-to-r from-rose-400 to-gold-400 bg-clip-text text-transparent">
                  {stateName}
                </span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl">
                Connect with {providers.length} pelvic floor{' '}
                {providers.length === 1 ? 'therapist' : 'therapists'} offering virtual
                consultations across {stateName}. Get expert care from the comfort of your home.
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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                <MapPin size={16} className="text-gold-400" />
                <span className="font-semibold text-ink">{cities.length}</span>{' '}
                {cities.length === 1 ? 'city' : 'cities'}
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
                  Telehealth providers in {stateName}
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
              {/* Cities with Telehealth */}
              {cities.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Cities with telehealth
                    </h3>
                    <ul className="space-y-2">
                      {cities.slice(0, 12).map((city) => (
                        <li key={city.city_slug}>
                          <Link
                            href={cityTelehealthRoute(stateSlug, city.city_slug)}
                            className="flex items-center gap-2.5 py-2 px-3 -mx-3 rounded-xl text-ink hover:text-rose-500 hover:bg-rose-50/60 transition-colors group/city"
                          >
                            <MapPin
                              size={15}
                              className="text-gold-400 shrink-0 group-hover/city:text-rose-400 transition-colors"
                            />
                            <span className="flex-1 font-medium text-sm">{city.city}</span>
                            <span className="text-xs text-ink-muted">{city.count}</span>
                            <ArrowRight
                              size={14}
                              className="text-warm-400 opacity-0 group-hover/city:opacity-100 transition-opacity"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              )}

              {/* Specialty Breakdown */}
              {specialties.length > 0 && (
                <AnimatedSection delay={0.25}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Specialties available via telehealth
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {specialties.slice(0, 15).map((specialty) => (
                        <Link
                          key={specialty.slug}
                          href={specialtyRoute(specialty.slug)}
                          className="tag tag-rose hover:bg-rose-100 transition-colors"
                        >
                          {specialty.name}
                          <span className="text-rose-400 text-xs ml-1">{specialty.count}</span>
                        </Link>
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
                Benefits of telehealth pelvic floor therapy in {stateName}
              </h2>
              <div className="mt-5 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  Telehealth pelvic floor physical therapy makes specialized care accessible
                  regardless of where you live in {stateName}. With {providers.length} qualified{' '}
                  {providers.length === 1 ? 'provider' : 'providers'} offering virtual
                  appointments, you can receive expert treatment from the comfort and privacy of
                  your own home.
                </p>
                <p>
                  Virtual pelvic floor therapy sessions are ideal for initial consultations,
                  exercise instruction, education about your condition, biofeedback guidance, and
                  ongoing follow-up care. Many patients find that telehealth reduces barriers to
                  treatment, including travel time, scheduling constraints, and the discomfort of
                  discussing sensitive topics in an unfamiliar setting.
                </p>
                <p>
                  Telehealth providers in {stateName} treat a wide range of conditions including
                  pelvic pain, urinary incontinence, postpartum recovery, pelvic organ prolapse,
                  and sexual health concerns. Your therapist can guide you through therapeutic
                  exercises, provide manual therapy education, and create a personalized home
                  program tailored to your goals.
                </p>
                {cities.length > 0 && (
                  <p>
                    Telehealth pelvic floor therapists are available across {cities.length}{' '}
                    {cities.length === 1 ? 'city' : 'cities'} in {stateName}, including{' '}
                    {cities
                      .slice(0, 4)
                      .map((c) => c.city)
                      .join(', ')}
                    {cities.length > 4 ? ', and more' : ''}. Browse all providers above or explore
                    a specific city for local telehealth options.
                  </p>
                )}
                <p>
                  Prefer in-person care? Browse all{' '}
                  <Link
                    href={stateRoute(stateSlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    pelvic floor therapists in {stateName}
                  </Link>{' '}
                  to find a provider near you.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
