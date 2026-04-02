import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, Users, Sparkles } from 'lucide-react';
import { getSpecialtyBySlug, getSpecialties, getProviders } from '@/lib/data';
import { SPECIALTY_META } from '@/lib/types';
import { deslugify } from '@/lib/utils';
import { specialtyRoute, specialtiesIndexRoute, cityRoute, providerRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProviderCard from '@/components/ProviderCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

interface PageProps {
  params: Promise<{ specialty: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: slug } = await params;
  const specialty = await getSpecialtyBySlug(slug);
  if (!specialty) return {};

  const title = `${specialty.name} Specialists - Find a Therapist | FindaPelvicPT`;
  const description =
    SPECIALTY_META[slug]?.description ||
    `Find ${specialty.name.toLowerCase()} specialists near you. Browse ${specialty.provider_count} qualified pelvic floor therapists on FindaPelvicPT.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${specialtyRoute(slug)}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${specialtyRoute(slug)}`,
      siteName: 'FindaPelvicPT',
      type: 'website',
    },
  };
}

export async function generateStaticParams() {
  const specialties = await getSpecialties();
  return specialties.map((s) => ({ specialty: s.slug }));
}

export default async function SpecialtyPage({ params }: PageProps) {
  const { specialty: slug } = await params;
  const specialty = await getSpecialtyBySlug(slug);
  if (!specialty) notFound();

  // Fetch providers using the full specialty name (not the slug)
  const [providers, allSpecialties] = await Promise.all([
    getProviders({ specialty: specialty.name }),
    getSpecialties(),
  ]);

  // Extract unique cities from providers for the sidebar
  const cityMap = new Map<string, { city: string; citySlug: string; state: string; stateSlug: string; count: number }>();
  for (const p of providers) {
    const key = `${p.city_slug}-${p.state_slug}`;
    const existing = cityMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(key, {
        city: p.city,
        citySlug: p.city_slug,
        state: p.state,
        stateSlug: p.state_slug,
        count: 1,
      });
    }
  }
  const cities = Array.from(cityMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Related specialties (exclude current)
  const relatedSpecialties = allSpecialties
    .filter((s) => s.slug !== slug)
    .slice(0, 8);

  const meta = SPECIALTY_META[slug];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${specialty.name} Specialists`,
    description: meta?.description || `Pelvic floor therapists specializing in ${specialty.name.toLowerCase()}.`,
    numberOfItems: providers.length,
    itemListElement: providers.slice(0, 50).map((provider, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MedicalBusiness',
        name: provider.display_name,
        description: provider.title || 'Pelvic Floor Physical Therapist',
        url: `${siteUrl}${providerRoute(provider.state_slug, provider.city_slug, provider.slug)}`,
        ...(provider.phone ? { telephone: provider.phone } : {}),
        medicalSpecialty: provider.specialties,
        address: {
          '@type': 'PostalAddress',
          ...(provider.address ? { streetAddress: provider.address } : {}),
          addressLocality: provider.city,
          addressRegion: provider.state,
          ...(provider.zip ? { postalCode: provider.zip } : {}),
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

      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="petal petal-rose w-[400px] h-[400px] -top-32 -right-40 rotate-12" />
        <div className="petal petal-gold w-[200px] h-[200px] bottom-0 -left-12 -rotate-12" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pb-20">
          <Breadcrumbs
            items={[
              { label: 'Specialties', href: specialtiesIndexRoute() },
              { label: specialty.name },
            ]}
          />

          <div className="max-w-3xl mt-6">
            <AnimatedSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>Specialty</span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                {specialty.name}{' '}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                    specialists
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-rose-100/60 rounded-full -z-0" />
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-2xl">
                {meta?.description || specialty.description}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-rose-400" />
                  {providers.length} provider{providers.length !== 1 ? 's' : ''}
                </span>
                {cities.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-warm-300" />
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-gold-400" />
                      {cities.length} cit{cities.length !== 1 ? 'ies' : 'y'}
                    </span>
                  </>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Provider List */}
            <div className="flex-1 min-w-0">
              <AnimatedSection>
                <h2 className="text-2xl font-bold text-ink mb-6">
                  {specialty.name} therapists
                  <span className="text-ink-muted font-normal text-lg ml-2">
                    ({providers.length})
                  </span>
                </h2>
              </AnimatedSection>

              {providers.length > 0 ? (
                <StaggerContainer className="space-y-5" staggerDelay={0.06}>
                  {providers.map((provider, i) => (
                    <StaggerItem key={provider.slug}>
                      <ProviderCard provider={provider} index={i} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <div className="card p-8 text-center">
                  <p className="text-ink-muted text-lg">
                    No providers found for this specialty yet. Check back soon as we are
                    continually expanding our directory.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 shrink-0 space-y-6">
              {/* Cities with this specialty */}
              {cities.length > 0 && (
                <AnimatedSection delay={0.2}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-gold-400" />
                      Cities with {specialty.name.toLowerCase()} specialists
                    </h3>
                    <ul className="space-y-2">
                      {cities.map((city) => (
                        <li key={`${city.citySlug}-${city.stateSlug}`}>
                          <Link
                            href={cityRoute(city.stateSlug, city.citySlug)}
                            className="flex items-center justify-between py-1.5 text-sm text-ink-muted hover:text-rose-500 transition-colors group/city"
                          >
                            <span className="group-hover/city:translate-x-0.5 transition-transform">
                              {city.city}, {city.state}
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

              {/* Related Specialties */}
              {relatedSpecialties.length > 0 && (
                <AnimatedSection delay={0.3}>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">
                      Related specialties
                    </h3>
                    <ul className="space-y-2">
                      {relatedSpecialties.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={specialtyRoute(s.slug)}
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
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      View all specialties
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </AnimatedSection>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 sm:py-20 bg-section-alt">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection>
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-ink">
                About {specialty.name.toLowerCase()} therapy
              </h2>
              <div className="mt-4 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  {meta?.description || specialty.description} Pelvic floor physical therapists
                  who specialize in {specialty.name.toLowerCase()} undergo advanced training to
                  provide targeted, evidence-based treatment for this condition.
                </p>
                <p>
                  Our directory features {providers.length} qualified{' '}
                  {specialty.name.toLowerCase()} specialist{providers.length !== 1 ? 's' : ''}{' '}
                  across {cities.length} cit{cities.length !== 1 ? 'ies' : 'y'}. Each provider
                  listing includes their credentials, practice information, accepted insurance,
                  and contact details so you can find the right fit for your needs.
                </p>
                <p>
                  If you are experiencing symptoms related to {specialty.name.toLowerCase()}, a
                  specialized pelvic floor therapist can create a personalized treatment plan to
                  help you improve your quality of life. Use the listings above to connect with a
                  provider near you.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
