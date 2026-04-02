import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sparkles, Users, ArrowRight } from 'lucide-react';
import { getProvidersForStateSpecialty, getSpecialties, getStates } from '@/lib/data';
import { deslugify } from '@/lib/utils';
import { SPECIALTY_META } from '@/lib/types';
import { stateRoute, stateSpecialtiesRoute, stateSpecialtyRoute, stateTelehealthRoute } from '@/lib/routes';
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

  const title = `Pelvic Floor Therapy Specialties in ${stateName} | FindaPelvicPT`;
  const description = `Browse all pelvic floor physical therapy specialties available in ${stateName}. Find providers by condition including pelvic pain, postpartum, prenatal, incontinence, and more.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}${stateSpecialtiesRoute(stateSlug)}` },
    openGraph: { title, description, url: `${siteUrl}${stateSpecialtiesRoute(stateSlug)}`, siteName: 'FindaPelvicPT', type: 'website' },
  };
}

export async function generateStaticParams() {
  const states = await getStates();
  return states.map((s) => ({ state: s.state_slug }));
}

export default async function StateSpecialtiesPage({ params }: PageProps) {
  const { state: stateSlug } = await params;
  const stateName = deslugify(stateSlug);

  const allSpecialties = await getSpecialties();
  if (!allSpecialties.length) notFound();

  // Get provider counts per specialty for this state
  const specialtiesWithCounts = await Promise.all(
    allSpecialties.map(async (s) => {
      const providers = await getProvidersForStateSpecialty(stateSlug, s.name);
      return { ...s, stateCount: providers.length };
    })
  );

  const activeSpecialties = specialtiesWithCounts
    .filter((s) => s.stateCount > 0)
    .sort((a, b) => b.stateCount - a.stateCount);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pelvic Floor Therapy Specialties in ${stateName}`,
    numberOfItems: activeSpecialties.length,
    itemListElement: activeSpecialties.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MedicalSpecialty',
        name: s.name,
        url: `${siteUrl}${stateSpecialtyRoute(stateSlug, s.slug)}`,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="petal petal-rose w-[400px] h-[400px] -top-32 -right-40 rotate-12" />
        <div className="petal petal-mauve w-[200px] h-[200px] bottom-0 -left-12 -rotate-12" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pb-20">
          <Breadcrumbs items={[{ label: stateName, href: stateRoute(stateSlug) }, { label: 'Specialties' }]} />

          <div className="max-w-3xl mt-6">
            <AnimatedSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>{activeSpecialties.length} specialties in {stateName}</span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                Pelvic floor therapy{' '}
                <span className="bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                  specialties
                </span>{' '}
                in {stateName}
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-2xl">
                Browse all pelvic floor physical therapy specialties available across {stateName}.
                Find the right specialist for your specific condition.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.06}>
            {activeSpecialties.map((specialty) => {
              const meta = SPECIALTY_META[specialty.slug];
              return (
                <StaggerItem key={specialty.slug}>
                  <Link
                    href={stateSpecialtyRoute(stateSlug, specialty.slug)}
                    className="card group/spec p-6 block h-full"
                  >
                    <h2 className="text-lg font-semibold text-ink group-hover/spec:text-rose-500 transition-colors">
                      {specialty.name}
                    </h2>
                    <p className="text-sm text-ink-muted mt-2 leading-relaxed line-clamp-2">
                      {meta?.description || specialty.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                        <Users size={14} className="text-rose-400" />
                        {specialty.stateCount} provider{specialty.stateCount !== 1 ? 's' : ''}
                      </span>
                      <ArrowRight size={16} className="text-warm-400 group-hover/spec:text-rose-400 group-hover/spec:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
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
              <h2 className="text-2xl font-bold text-ink">
                Finding the right specialist in {stateName}
              </h2>
              <div className="mt-4 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  Pelvic floor physical therapy encompasses a wide range of specialties, each targeting
                  different conditions and patient needs. Whether you&apos;re recovering from childbirth,
                  managing chronic pelvic pain, or seeking treatment for incontinence, {stateName} has
                  qualified specialists who can help.
                </p>
                <p>
                  Browse the specialties above to find providers who focus on your specific condition.
                  Each specialty page shows all available providers in {stateName}, along with the cities
                  where they practice. You can also{' '}
                  <Link href={stateRoute(stateSlug)} className="text-rose-500 hover:text-rose-600 font-medium">
                    browse all providers in {stateName}
                  </Link>{' '}
                  or explore{' '}
                  <Link href={stateTelehealthRoute(stateSlug)} className="text-rose-500 hover:text-rose-600 font-medium">
                    telehealth options
                  </Link>{' '}
                  for virtual appointments.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
