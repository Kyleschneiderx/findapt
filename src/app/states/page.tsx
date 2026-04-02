import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Users, Building2 } from 'lucide-react';
import { getStates } from '@/lib/data';
import { stateRoute } from '@/lib/routes';
import { deslugify } from '@/lib/utils';
import Breadcrumbs from '@/components/Breadcrumbs';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

export const metadata: Metadata = {
  title: 'Browse by State — Pelvic Floor Physical Therapists Nationwide | FindaPelvicPT',
  description:
    'Find pelvic floor physical therapists in all 50 states. Browse our nationwide directory of qualified pelvic health specialists by state.',
  alternates: { canonical: `${siteUrl}/states` },
  openGraph: {
    title: 'Browse by State — Pelvic Floor Physical Therapists Nationwide',
    description: 'Find pelvic floor physical therapists in all 50 states.',
    url: `${siteUrl}/states`,
    siteName: 'FindaPelvicPT',
    type: 'website',
  },
};

export default async function StatesPage() {
  const rawStates = await getStates();
  const states = rawStates.sort((a, b) => a.state_slug.localeCompare(b.state_slug));
  const totalProviders = states.reduce((sum, s) => sum + s.provider_count, 0);
  const totalCities = states.reduce((sum, s) => sum + s.city_count, 0);

  return (
    <>
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="petal petal-rose w-[400px] h-[400px] -top-32 -right-40 rotate-12" />
        <div className="petal petal-mauve w-[250px] h-[250px] bottom-0 -left-16 -rotate-12" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pb-20">
          <Breadcrumbs items={[{ label: 'States' }]} />

          <div className="max-w-3xl mt-6">
            <AnimatedSection delay={0.1}>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                Pelvic floor therapists{' '}
                <span className="bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                  nationwide
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-2xl">
                Browse {totalProviders}+ qualified pelvic floor physical therapists across {states.length} states
                and {totalCities} cities.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-rose-400" />
                  {states.length} states
                </span>
                <span className="w-1 h-1 rounded-full bg-warm-300" />
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gold-400" />
                  {totalCities} cities
                </span>
                <span className="w-1 h-1 rounded-full bg-warm-300" />
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-mauve-400" />
                  {totalProviders}+ providers
                </span>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" staggerDelay={0.03}>
            {states.map((state) => (
              <StaggerItem key={state.state_slug}>
                <Link
                  href={stateRoute(state.state_slug)}
                  className="card group/state p-5 flex items-start gap-3 h-full"
                >
                  <MapPin size={18} className="text-gold-400 shrink-0 mt-0.5 group-hover/state:text-rose-400 transition-colors" />
                  <div>
                    <h2 className="font-semibold text-ink group-hover/state:text-rose-500 transition-colors">
                      {deslugify(state.state_slug)}
                    </h2>
                    <p className="text-sm text-ink-muted mt-0.5">
                      {state.provider_count} providers &middot; {state.city_count} cities
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Pelvic Floor Physical Therapists by State',
            numberOfItems: states.length,
            itemListElement: states.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Thing',
                name: s.state,
                url: `${siteUrl}${stateRoute(s.state_slug)}`,
              },
            })),
          }),
        }}
      />
    </>
  );
}
