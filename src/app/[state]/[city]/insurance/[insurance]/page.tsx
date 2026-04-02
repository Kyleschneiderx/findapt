import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shield, Users, ArrowRight, Filter } from 'lucide-react';
import { getProvidersByInsurance, getInsurancesForCity, getCityBySlug } from '@/lib/data';
import { insuranceSlugToName, deslugify, slugify } from '@/lib/utils';
import { stateRoute, cityRoute, cityInsuranceRoute, cityTelehealthRoute, specialtyRoute, providerRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProviderCard from '@/components/ProviderCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

interface InsurancePageProps {
  params: Promise<{ state: string; city: string; insurance: string }>;
}

export async function generateMetadata({ params }: InsurancePageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, insurance: insuranceSlug } = await params;
  const cityInfo = await getCityBySlug(citySlug, stateSlug);
  const insuranceName = insuranceSlugToName(insuranceSlug);

  if (!cityInfo) {
    return { title: 'City Not Found | FindaPelvicPT' };
  }

  const stateName = deslugify(stateSlug);
  const title = `${insuranceName} Pelvic Floor Physical Therapy in ${cityInfo.city}, ${stateName} | FindaPelvicPT`;
  const description = `Find pelvic floor physical therapists in ${cityInfo.city}, ${stateName} who accept ${insuranceName}. Compare providers, view specialties, and book appointments.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${cityInsuranceRoute(stateSlug, citySlug, insuranceSlug)}`,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}${cityInsuranceRoute(stateSlug, citySlug, insuranceSlug)}`,
    },
  };
}

export default async function InsurancePage({ params }: InsurancePageProps) {
  const { state: stateSlug, city: citySlug, insurance: insuranceSlug } = await params;

  const insuranceName = insuranceSlugToName(insuranceSlug);

  const [cityInfo, providers, allInsurances] = await Promise.all([
    getCityBySlug(citySlug, stateSlug),
    getProvidersByInsurance(stateSlug, citySlug, insuranceName),
    getInsurancesForCity(stateSlug, citySlug),
  ]);

  if (!cityInfo || providers.length < 2) {
    notFound();
  }

  const stateName = deslugify(stateSlug);

  // Collect specialties across providers accepting this insurance
  const specialtyMap = new Map<string, number>();
  providers.forEach((provider) => {
    provider.specialties.forEach((s) => {
      specialtyMap.set(s, (specialtyMap.get(s) || 0) + 1);
    });
  });
  const specialties = Array.from(specialtyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, slug: slugify(name), count }));

  // Other insurance types in this city (excluding current)
  const otherInsurances = allInsurances.filter((ins) => ins.slug !== insuranceSlug);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${insuranceName} Pelvic Floor Physical Therapists in ${cityInfo.city}, ${stateName}`,
    description: `${providers.length} pelvic floor physical therapists accepting ${insuranceName} in ${cityInfo.city}, ${stateName}.`,
    url: `${siteUrl}${cityInsuranceRoute(stateSlug, citySlug, insuranceSlug)}`,
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
        paymentAccepted: insuranceName,
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
        <div className="petal petal-mauve w-[350px] h-[350px] -top-28 -right-28 rotate-12" />
        <div className="petal petal-rose w-[200px] h-[200px] bottom-0 -left-12 -rotate-12" />
        <div className="petal petal-gold w-[150px] h-[150px] top-1/3 right-1/4 rotate-45" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-14 sm:pb-18">
          <Breadcrumbs
            items={[
              { label: stateName, href: stateRoute(stateSlug) },
              { label: cityInfo.city, href: cityRoute(stateSlug, citySlug) },
              { label: 'Insurance', href: cityRoute(stateSlug, citySlug) },
              { label: insuranceName },
            ]}
          />

          <AnimatedSection delay={0.1}>
            <div className="mt-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mauve-50 border border-mauve-200 text-mauve-600 text-sm font-medium mb-4">
                <Shield size={16} />
                Insurance accepted
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                <span className="bg-gradient-to-r from-mauve-400 to-rose-400 bg-clip-text text-transparent">
                  {insuranceName}
                </span>{' '}
                pelvic floor therapy in{' '}
                <span className="text-ink">{cityInfo.city}</span>
                <span className="text-ink-muted font-normal text-2xl sm:text-3xl lg:text-4xl">
                  , {stateName}
                </span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl">
                {providers.length} pelvic floor{' '}
                {providers.length === 1 ? 'therapist' : 'therapists'} in {cityInfo.city} accept{' '}
                {insuranceName}. Compare providers, view specialties, and find the right fit for
                your care.
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
                <Shield size={16} className="text-mauve-400" />
                {insuranceName}
              </span>
              {specialties.length > 0 && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-warm-200">
                  <Filter size={16} className="text-gold-400" />
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
                  Providers accepting {insuranceName} in {cityInfo.city}
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
              {/* Other Insurance Types */}
              {otherInsurances.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Other insurance in {cityInfo.city}
                    </h3>
                    <ul className="space-y-2">
                      {otherInsurances.slice(0, 10).map((ins) => (
                        <li key={ins.slug}>
                          <Link
                            href={cityInsuranceRoute(stateSlug, citySlug, ins.slug)}
                            className="flex items-center gap-2.5 py-2 px-3 -mx-3 rounded-xl text-ink hover:text-rose-500 hover:bg-rose-50/60 transition-colors group/ins"
                          >
                            <Shield
                              size={15}
                              className="text-mauve-400 shrink-0 group-hover/ins:text-rose-400 transition-colors"
                            />
                            <span className="flex-1 font-medium text-sm">{ins.name}</span>
                            <span className="text-xs text-ink-muted">{ins.count}</span>
                            <ArrowRight
                              size={14}
                              className="text-warm-400 opacity-0 group-hover/ins:opacity-100 transition-opacity"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              )}

              {/* Specialties */}
              {specialties.length > 0 && (
                <AnimatedSection delay={0.25}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Specialties available
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty) => (
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

              {/* Link to full city page */}
              <AnimatedSection delay={0.35}>
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-ink mb-3">
                    All {cityInfo.city} providers
                  </h3>
                  <p className="text-sm text-ink-muted mb-4">
                    View all {cityInfo.provider_count} pelvic floor therapists in {cityInfo.city},
                    regardless of insurance.
                  </p>
                  <Link
                    href={cityRoute(stateSlug, citySlug)}
                    className="btn-secondary text-sm py-2.5 px-5"
                  >
                    <span>Browse all providers</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </AnimatedSection>
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
                Finding {insuranceName} pelvic floor therapists in {cityInfo.city}
              </h2>
              <div className="mt-5 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  Navigating insurance coverage for pelvic floor physical therapy can be
                  challenging. In {cityInfo.city}, {providers.length}{' '}
                  {providers.length === 1 ? 'provider' : 'providers'} accept {insuranceName},
                  making it easier to find affordable, specialized care without unexpected
                  out-of-pocket costs.
                </p>
                <p>
                  Pelvic floor physical therapy covered by {insuranceName} typically includes
                  initial evaluations, follow-up treatment sessions, and specialized techniques
                  such as biofeedback, manual therapy, and therapeutic exercise. Coverage details
                  may vary by plan, so we recommend contacting both your insurance provider and the
                  therapist&apos;s office to confirm your specific benefits before scheduling.
                </p>
                {specialties.length > 0 && (
                  <p>
                    {insuranceName}-accepting providers in {cityInfo.city} offer expertise in{' '}
                    {specialties.length}{' '}
                    {specialties.length === 1 ? 'specialty' : 'specialties'}, including{' '}
                    {specialties
                      .slice(0, 4)
                      .map((s) => s.name.toLowerCase())
                      .join(', ')}
                    {specialties.length > 4 ? ', and more' : ''}. Whether you need help with
                    postpartum recovery, pelvic pain, or another condition, you can find a qualified
                    provider who works with your insurance above.
                  </p>
                )}
                <p>
                  Don&apos;t see a provider that fits your needs? Browse all{' '}
                  <Link
                    href={cityRoute(stateSlug, citySlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    pelvic floor therapists in {cityInfo.city}
                  </Link>
                  {otherInsurances.length > 0 && (
                    <>
                      {' '}or check providers accepting{' '}
                      <Link
                        href={cityInsuranceRoute(stateSlug, citySlug, otherInsurances[0].slug)}
                        className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                      >
                        {otherInsurances[0].name}
                      </Link>
                    </>
                  )}
                  . You can also explore providers who offer{' '}
                  <Link
                    href={cityTelehealthRoute(stateSlug, citySlug)}
                    className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    telehealth consultations
                  </Link>{' '}
                  for added convenience.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
