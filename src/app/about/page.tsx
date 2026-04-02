import type { Metadata } from 'next';
import { Heart, Shield, Users, MapPin } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

export const metadata: Metadata = {
  title: 'About FindaPelvicPT',
  description:
    'FindaPelvicPT is a free directory helping patients find specialized pelvic floor physical therapists. Learn about our mission to improve access to pelvic health care.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: 'About FindaPelvicPT',
    description: 'Free directory helping patients find specialized pelvic floor physical therapists.',
    url: `${siteUrl}/about`,
    siteName: 'FindaPelvicPT',
    type: 'website',
  },
};

export default function AboutPage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FindaPelvicPT',
    url: siteUrl,
    description: 'Free directory connecting patients with specialized pelvic floor physical therapists.',
    foundingDate: '2025',
    sameAs: [],
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    serviceType: 'Healthcare Provider Directory',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <Breadcrumbs items={[{ label: 'About' }]} />
      </div>

      {/* Hero */}
      <section className="bg-hero-gradient relative overflow-hidden py-16 sm:py-24">
        <div className="petal petal-rose w-[400px] h-[400px] -top-32 -right-32 rotate-12" />
        <div className="petal petal-mauve w-[250px] h-[250px] bottom-0 -left-16 -rotate-12" />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <AnimatedSection>
            <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
              About Find<span className="text-rose-500">a</span>PelvicPT
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto">
              We believe everyone deserves easy access to specialized pelvic floor care.
              FindaPelvicPT is a free directory connecting patients with qualified pelvic health professionals.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20 bg-section-gradient">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <StaggerContainer className="grid sm:grid-cols-2 gap-8" staggerDelay={0.1}>
            {[
              { icon: Heart, title: 'Patient-First', description: 'Built to help patients find the right care, not to sell leads. All information is freely accessible.', color: 'rose' },
              { icon: Shield, title: 'Verified Data', description: 'Provider information is sourced from professional directories and validated through our multi-step cleaning pipeline.', color: 'mauve' },
              { icon: Users, title: 'Comprehensive', description: 'We cover a wide range of specialties from postpartum recovery to pelvic pain management to pediatric care.', color: 'gold' },
              { icon: MapPin, title: 'Local Focus', description: 'Find providers in your city. Browse by location to discover therapists near you with the specialties you need.', color: 'rose' },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <div className="card p-8 h-full">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${item.color === 'rose' ? 'bg-rose-50 text-rose-500' : item.color === 'mauve' ? 'bg-mauve-50 text-mauve-500' : 'bg-gold-50 text-gold-500'}`}>
                    <item.icon size={22} />
                  </div>
                  <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-ink-muted leading-relaxed">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 bg-section-alt">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection>
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-ink mb-4">Why pelvic floor therapy matters</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                Pelvic floor conditions affect millions of people, yet finding a qualified specialist
                can be surprisingly difficult. Many patients don&apos;t know where to start looking, and
                general physician directories rarely highlight pelvic floor specialization.
              </p>
              <p className="text-ink-muted leading-relaxed mb-4">
                FindaPelvicPT was created to bridge this gap. Our directory focuses exclusively on
                pelvic floor physical therapists and related specialists, making it easy to find
                providers who understand your specific needs.
              </p>
              <h2 className="text-2xl font-bold text-ink mb-4 mt-10">Our data</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                Provider information is sourced from professional rehabilitation directories
                and undergoes a multi-agent validation pipeline that checks city names, phone
                numbers, websites, zip codes, and overall data quality before being published.
              </p>
              <p className="text-ink-muted leading-relaxed">
                If you&apos;re a provider and would like to update your listing, or if you notice
                any inaccuracies, please reach out to us. We&apos;re committed to keeping our
                directory accurate and up-to-date.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
