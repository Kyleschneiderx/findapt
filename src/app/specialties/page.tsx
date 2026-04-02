import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getSpecialties } from '@/lib/data';
import { SPECIALTY_META } from '@/lib/types';
import { specialtiesIndexRoute, specialtyRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pelvic Floor Therapy Specialties | FindaPelvicPT',
    description:
      'Explore all pelvic floor therapy specialties including pelvic pain, incontinence, postpartum recovery, prenatal care, and more. Find a specialist for your needs.',
    alternates: {
      canonical: `${siteUrl}${specialtiesIndexRoute()}`,
    },
    openGraph: {
      title: 'Pelvic Floor Therapy Specialties | FindaPelvicPT',
      description:
        'Browse specialized pelvic floor therapy treatments and find the right specialist for your condition.',
      url: `${siteUrl}${specialtiesIndexRoute()}`,
      siteName: 'FindaPelvicPT',
      type: 'website',
    },
  };
}

export default async function SpecialtiesPage() {
  const specialties = await getSpecialties();
  const totalProviders = specialties.reduce((sum, s) => sum + s.provider_count, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pelvic Floor Therapy Specialties',
    description: 'All pelvic floor physical therapy specialties available on FindaPelvicPT.',
    numberOfItems: specialties.length,
    itemListElement: specialties.map((specialty, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: specialty.name,
      url: `${siteUrl}${specialtyRoute(specialty.slug)}`,
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
        <div className="petal petal-mauve w-[400px] h-[400px] -top-32 -right-32 rotate-12" />
        <div className="petal petal-rose w-[250px] h-[250px] bottom-0 -left-16 -rotate-12" />
        <div className="petal petal-gold w-[180px] h-[180px] top-1/4 right-1/3 rotate-45" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pb-20">
          <Breadcrumbs items={[{ label: 'Specialties' }]} />

          <div className="max-w-3xl mt-6">
            <AnimatedSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mauve-50 border border-mauve-100 text-mauve-600 text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>{specialties.length} specialties</span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
                Pelvic floor therapy{' '}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-mauve-400 to-rose-500 bg-clip-text text-transparent">
                    specialties
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-mauve-100/60 rounded-full -z-0" />
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-2xl">
                Browse {specialties.length} specialized areas of pelvic floor physical therapy.
                Our directory connects you with {totalProviders}+ therapists across a wide range
                of conditions and treatment approaches.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Specialty Grid */}
      <section className="py-16 sm:py-20 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <StaggerContainer
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            staggerDelay={0.05}
          >
            {specialties.map((specialty) => {
              const meta = SPECIALTY_META[specialty.slug];
              return (
                <StaggerItem key={specialty.slug}>
                  <Link
                    href={specialtyRoute(specialty.slug)}
                    className="card group/spec p-6 block h-full"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-ink group-hover/spec:text-rose-500 transition-colors">
                          {specialty.name}
                        </h2>
                        <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
                          {meta?.description || specialty.description}
                        </p>
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-warm-400 group-hover/spec:text-rose-400 group-hover/spec:translate-x-0.5 transition-all shrink-0 mt-1"
                      />
                    </div>
                    <div className="mt-4 pt-3 border-t border-warm-200">
                      <span className="tag tag-rose text-xs">
                        {specialty.provider_count} provider{specialty.provider_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 sm:py-20 bg-section-alt">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection>
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-ink">
                About pelvic floor therapy specialties
              </h2>
              <div className="mt-4 space-y-4 text-ink-muted leading-relaxed">
                <p>
                  Pelvic floor physical therapy encompasses a diverse range of specialties, each
                  focused on specific conditions and patient populations. From prenatal and
                  postpartum care to chronic pain management and oncology rehabilitation, these
                  therapists bring advanced training and expertise to help you achieve your health
                  goals.
                </p>
                <p>
                  Whether you are dealing with urinary incontinence, pelvic organ prolapse,
                  diastasis recti, or sexual health concerns, our directory helps you find a
                  therapist who specializes in your specific condition. Many therapists hold
                  additional certifications and have years of focused experience in their chosen
                  specialty areas.
                </p>
                <p>
                  Use the specialty cards above to explore each area in detail and find qualified
                  providers near you.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
