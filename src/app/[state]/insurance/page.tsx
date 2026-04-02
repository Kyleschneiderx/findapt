import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shield, Users, MapPin, ArrowRight } from 'lucide-react';
import { getProviders } from '@/lib/data';
import { deslugify, slugify } from '@/lib/utils';
import { stateRoute, stateInsuranceRoute, stateSpecialtiesRoute, cityInsuranceRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

interface PageProps {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateName = deslugify(stateSlug);

  const title = `Pelvic Floor PT by Insurance in ${stateName} | FindaPelvicPT`;
  const description = `Find pelvic floor physical therapists in ${stateName} by insurance. Browse providers that accept Medi-Cal, Medicare, Kaiser, Aetna, Blue Cross, and more.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}${stateInsuranceRoute(stateSlug)}` },
    openGraph: { title, description, url: `${siteUrl}${stateInsuranceRoute(stateSlug)}`, siteName: 'FindaPelvicPT', type: 'website' },
  };
}

export async function generateStaticParams() {
  return [{ state: 'california' }];
}

export default async function StateInsurancePage({ params }: PageProps) {
  const { state: stateSlug } = await params;
  const stateName = deslugify(stateSlug);

  const providers = await getProviders({ state_slug: stateSlug });
  if (!providers.length) notFound();

  // Build insurance → city map
  const insuranceMap: Record<string, {
    name: string;
    slug: string;
    totalCount: number;
    cities: Record<string, { city: string; citySlug: string; count: number }>;
  }> = {};

  for (const p of providers) {
    for (const ins of p.insurance_accepted) {
      const name = ins.trim();
      if (!name || name === 'Contact for details' || name === 'Unknown') continue;
      const slug = slugify(name);

      if (!insuranceMap[slug]) {
        insuranceMap[slug] = { name, slug, totalCount: 0, cities: {} };
      }
      insuranceMap[slug].totalCount++;

      if (!insuranceMap[slug].cities[p.city_slug]) {
        insuranceMap[slug].cities[p.city_slug] = { city: p.city, citySlug: p.city_slug, count: 0 };
      }
      insuranceMap[slug].cities[p.city_slug].count++;
    }
  }

  const insurances = Object.values(insuranceMap)
    .filter((i) => i.totalCount >= 2)
    .sort((a, b) => b.totalCount - a.totalCount);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pelvic Floor PT by Insurance in ${stateName}`,
    numberOfItems: insurances.length,
    itemListElement: insurances.map((ins, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': 'Thing', name: ins.name },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="petal petal-mauve w-[400px] h-[400px] -top-32 -right-40 rotate-12" />
        <div className="petal petal-rose w-[200px] h-[200px] bottom-0 -left-12 -rotate-12" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pb-20">
          <Breadcrumbs items={[{ label: stateName, href: stateRoute(stateSlug) }, { label: 'Insurance' }]} />

          <div className="max-w-3xl mt-6">
            <AnimatedSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mauve-50 border border-mauve-100 text-mauve-600 text-sm font-medium mb-6">
                <Shield size={16} />
                <span>{insurances.length} insurance types accepted</span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                Find pelvic floor PT by{' '}
                <span className="bg-gradient-to-r from-mauve-400 to-rose-500 bg-clip-text text-transparent">
                  insurance
                </span>{' '}
                in {stateName}
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-2xl">
                Browse pelvic floor physical therapists by the insurance they accept. Find
                in-network providers for your plan across {stateName}.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.06}>
            {insurances.map((insurance) => {
              const topCities = Object.values(insurance.cities)
                .sort((a, b) => b.count - a.count)
                .slice(0, 4);

              return (
                <StaggerItem key={insurance.slug}>
                  <div className="card p-6 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-lg font-semibold text-ink">{insurance.name}</h2>
                      <span className="tag tag-mauve text-xs shrink-0 ml-2">
                        {insurance.totalCount} provider{insurance.totalCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <p className="text-sm text-ink-muted mb-4">
                      Available in {Object.keys(insurance.cities).length} cit{Object.keys(insurance.cities).length !== 1 ? 'ies' : 'y'}
                    </p>

                    <div className="space-y-1.5">
                      {topCities.map((city) => (
                        <Link
                          key={city.citySlug}
                          href={cityInsuranceRoute(stateSlug, city.citySlug, insurance.slug)}
                          className="flex items-center justify-between py-1 text-sm text-ink-muted hover:text-rose-500 transition-colors group/city"
                        >
                          <span className="flex items-center gap-1.5 group-hover/city:translate-x-0.5 transition-transform">
                            <MapPin size={12} className="text-gold-400" />
                            {city.city}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <Users size={11} />
                            {city.count}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {Object.keys(insurance.cities).length > 4 && (
                      <p className="mt-2 text-xs text-ink-muted">
                        +{Object.keys(insurance.cities).length - 4} more cities
                      </p>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-section-alt">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection>
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-ink">Insurance coverage for pelvic floor therapy</h2>
              <div className="mt-4 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  Many insurance plans in {stateName} cover pelvic floor physical therapy when deemed
                  medically necessary. Coverage varies by plan and provider. We recommend contacting
                  both your insurance company and the provider&apos;s office to confirm coverage before
                  your first appointment.
                </p>
                <p>
                  Browse the insurance types above to find providers in specific cities. You can also{' '}
                  <Link href={stateRoute(stateSlug)} className="text-rose-500 hover:text-rose-600 font-medium">
                    view all providers in {stateName}
                  </Link>{' '}
                  or{' '}
                  <Link href={stateSpecialtiesRoute(stateSlug)} className="text-rose-500 hover:text-rose-600 font-medium">
                    browse by specialty
                  </Link>.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
