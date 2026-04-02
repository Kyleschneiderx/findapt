import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Users, Building2, ArrowRight } from 'lucide-react';
import { getCities, getStates } from '@/lib/data';
import { deslugify } from '@/lib/utils';
import { stateRoute, cityRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  const states = await getStates();
  return states.map((s) => ({ state: s.state_slug }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateName = deslugify(stateSlug);
  const cities = await getCities(stateSlug);
  const totalProviders = cities.reduce((sum, c) => sum + c.provider_count, 0);

  const title = `Pelvic Floor Physical Therapists in ${stateName} | FindaPelvicPT`;
  const description = `Find ${totalProviders}+ pelvic floor physical therapists across ${cities.length} cities in ${stateName}. Browse providers by city, compare specialties, and book your appointment.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${stateRoute(stateSlug)}`,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${stateRoute(stateSlug)}`,
    },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { state: stateSlug } = await params;
  const cities = await getCities(stateSlug);

  if (cities.length === 0) {
    notFound();
  }

  const stateName = deslugify(stateSlug);
  const stateAbbr = cities[0]?.state || stateSlug.toUpperCase();
  const totalProviders = cities.reduce((sum, c) => sum + c.provider_count, 0);

  // Group cities alphabetically
  const grouped = cities
    .sort((a, b) => a.city.localeCompare(b.city))
    .reduce<Record<string, typeof cities>>((acc, city) => {
      const letter = city.city.charAt(0).toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(city);
      return acc;
    }, {});

  const letters = Object.keys(grouped).sort();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pelvic Floor Physical Therapists in ${stateName}`,
    description: `Directory of ${totalProviders} pelvic floor physical therapists across ${cities.length} cities in ${stateName}.`,
    url: `${siteUrl}${stateRoute(stateSlug)}`,
    numberOfItems: cities.length,
    itemListElement: cities.slice(0, 50).map((city, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${city.city}, ${stateAbbr}`,
      url: `${siteUrl}${cityRoute(stateSlug, city.city_slug)}`,
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
        <div className="petal petal-rose w-[400px] h-[400px] -top-32 -right-32 rotate-12" />
        <div className="petal petal-mauve w-[250px] h-[250px] bottom-0 -left-16 -rotate-12" />
        <div className="petal petal-gold w-[180px] h-[180px] top-1/4 right-1/3 rotate-45" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-16 sm:pb-20">
          <Breadcrumbs items={[{ label: stateName }]} />

          <AnimatedSection delay={0.1}>
            <div className="mt-6 max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                Pelvic floor therapists in{' '}
                <span className="bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                  {stateName}
                </span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl">
                Browse {totalProviders}+ specialized pelvic floor physical therapists across{' '}
                {cities.length} cities in {stateName}. Find expert care near you.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                <Users size={16} className="text-rose-400" />
                <span className="font-semibold text-ink">{totalProviders}</span> providers
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                <Building2 size={16} className="text-mauve-400" />
                <span className="font-semibold text-ink">{cities.length}</span> cities
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Alphabet Quick-Nav ─── */}
      <section className="sticky top-16 z-30 bg-warm-50/90 backdrop-blur-md border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3">
          <nav aria-label="Alphabetical navigation" className="flex flex-wrap gap-1.5">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold text-ink-muted hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                {letter}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ─── Cities Grid ─── */}
      <section className="py-14 sm:py-20 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          {letters.map((letter, letterIdx) => (
            <div key={letter} id={`letter-${letter}`} className={letterIdx > 0 ? 'mt-12' : ''}>
              <AnimatedSection>
                <div className="flex items-center gap-4 mb-6">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 font-bold text-lg">
                    {letter}
                  </span>
                  <div className="h-px flex-1 bg-warm-200" />
                  <span className="text-sm text-ink-muted">
                    {grouped[letter].length} {grouped[letter].length === 1 ? 'city' : 'cities'}
                  </span>
                </div>
              </AnimatedSection>

              <StaggerContainer
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                staggerDelay={0.04}
              >
                {grouped[letter].map((city) => (
                  <StaggerItem key={city.city_slug}>
                    <Link
                      href={cityRoute(stateSlug, city.city_slug)}
                      className="card group/city p-5 flex items-start gap-3 h-full"
                    >
                      <MapPin
                        size={18}
                        className="text-gold-400 shrink-0 mt-0.5 group-hover/city:text-rose-400 transition-colors"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-ink group-hover/city:text-rose-500 transition-colors">
                          {city.city}
                        </h3>
                        <p className="text-sm text-ink-muted mt-0.5">
                          {city.provider_count} provider{city.provider_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-warm-400 shrink-0 mt-0.5 opacity-0 group-hover/city:opacity-100 group-hover/city:translate-x-0.5 transition-all"
                      />
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SEO Content ─── */}
      <section className="py-16 sm:py-20 bg-section-alt">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection>
            <div className="card p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-ink">
                About pelvic floor therapy in {stateName}
              </h2>
              <div className="mt-5 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  {stateName} is home to {totalProviders}+ qualified pelvic floor physical
                  therapists practicing across {cities.length} cities. Whether you are seeking help
                  with pelvic pain, urinary incontinence, postpartum recovery, or pelvic organ
                  prolapse, you can find a specialized provider near you.
                </p>
                <p>
                  Pelvic floor physical therapy is a specialized branch of rehabilitation that
                  addresses dysfunction of the pelvic floor muscles. These muscles support the
                  bladder, bowel, and reproductive organs. Treatment may include manual therapy,
                  biofeedback, therapeutic exercises, and patient education.
                </p>
                <p>
                  Many providers in {stateName} offer telehealth consultations, making it easier
                  than ever to access expert care regardless of your location. Browse our directory
                  to compare providers by city, view specialties, and find the right therapist for
                  your needs.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
