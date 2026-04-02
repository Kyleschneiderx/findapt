import Link from 'next/link';
import { ArrowRight, MapPin, Shield, Users, Heart, Star, Sparkles } from 'lucide-react';
import { getCities, getSpecialties, getFeaturedProviders, getStates } from '@/lib/data';
import SearchBar from '@/components/SearchBar';
import ProviderCard from '@/components/ProviderCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { stateRoute, statesIndexRoute, cityRoute, specialtiesIndexRoute, specialtyRoute } from '@/lib/routes';

export const revalidate = 3600;

export default async function HomePage() {
  const [allCities, specialties, featuredProviders, states] = await Promise.all([
    getCities(),
    getSpecialties(),
    getFeaturedProviders(),
    getStates(),
  ]);

  const topCities = allCities.slice(0, 12);
  const topSpecialties = specialties.slice(0, 8);
  const totalProviders = allCities.reduce((sum, c) => sum + c.provider_count, 0);
  const topStates = states.slice(0, 8);

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="petal petal-rose w-[500px] h-[500px] -top-40 -right-40 rotate-12" />
        <div className="petal petal-mauve w-[300px] h-[300px] bottom-0 -left-20 -rotate-12" />
        <div className="petal petal-gold w-[200px] h-[200px] top-1/3 right-1/4 rotate-45" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium mb-8">
                <Sparkles size={16} />
                <span>Trusted pelvic health directory</span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.1]">
                Find a pelvic floor{' '}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                    physical therapist
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-rose-100/60 rounded-full -z-0" />
                </span>{' '}
                near you
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <p className="mt-6 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl mx-auto">
                Connect with {totalProviders}+ specialized pelvic floor therapists across{' '}
                {states.length} states and {allCities.length} cities. Expert care for your most personal health needs.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="mt-10 max-w-xl mx-auto">
                <SearchBar variant="hero" />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.5}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Shield size={14} className="text-rose-400" />
                  {states.length} states
                </span>
                <span className="w-1 h-1 rounded-full bg-warm-300" />
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gold-400" />
                  {allCities.length} cities
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

      {/* ─── How It Works ─── */}
      <section className="py-20 sm:py-24 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink">How it works</h2>
            <p className="mt-3 text-ink-muted text-lg max-w-2xl mx-auto">
              Finding the right pelvic floor therapist shouldn&apos;t be complicated.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid sm:grid-cols-3 gap-8" staggerDelay={0.12}>
            {[
              { step: '01', title: 'Search your area', description: 'Browse by city or zip code to find therapists near you.', color: 'rose' as const },
              { step: '02', title: 'Compare providers', description: 'View specialties, credentials, insurance, and telehealth options.', color: 'mauve' as const },
              { step: '03', title: 'Get care', description: 'Contact your chosen provider directly by phone or website.', color: 'gold' as const },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="card p-8 h-full text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color === 'rose' ? 'bg-rose-100 text-rose-500' : item.color === 'mauve' ? 'bg-mauve-100 text-mauve-500' : 'bg-gold-100 text-gold-500'}`}>
                      {item.color === 'rose' && <MapPin size={26} strokeWidth={2.5} />}
                      {item.color === 'mauve' && <Star size={26} strokeWidth={2.5} fill="currentColor" />}
                      {item.color === 'gold' && <Heart size={26} strokeWidth={2.5} fill="currentColor" />}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">Step {item.step}</p>
                  <h3 className="mt-2 text-xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-ink-muted leading-relaxed">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Browse by Specialty ─── */}
      <section className="py-20 sm:py-24 bg-section-alt">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <AnimatedSection className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink">Browse by specialty</h2>
              <p className="mt-3 text-ink-muted text-lg">Find therapists who specialize in your specific condition.</p>
            </div>
            <Link href={specialtiesIndexRoute()} className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors group">
              View all
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" staggerDelay={0.06}>
            {topSpecialties.map((specialty) => (
              <StaggerItem key={specialty.slug}>
                <Link href={specialtyRoute(specialty.slug)} className="card group/spec p-5 block h-full">
                  <h3 className="font-semibold text-ink group-hover/spec:text-rose-500 transition-colors">{specialty.name}</h3>
                  <p className="text-sm text-ink-muted mt-1">{specialty.provider_count} provider{specialty.provider_count !== 1 ? 's' : ''}</p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="mt-6 sm:hidden text-center">
            <Link href={specialtiesIndexRoute()} className="btn-secondary inline-flex">
              <span>View all specialties</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Browse by State ─── */}
      <section className="py-20 sm:py-24 bg-section-gradient">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <AnimatedSection className="mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink">Browse by state</h2>
              <p className="mt-3 text-ink-muted text-lg">Find pelvic floor therapists across the United States.</p>
            </div>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" staggerDelay={0.05}>
            {topStates.map((state) => (
              <StaggerItem key={state.state_slug}>
                <Link href={stateRoute(state.state_slug)} className="card group/state p-5 flex items-start gap-3 h-full">
                  <MapPin size={18} className="text-gold-400 shrink-0 mt-0.5 group-hover/state:text-rose-400 transition-colors" />
                  <div>
                    <h3 className="font-semibold text-ink group-hover/state:text-rose-500 transition-colors">{state.state}</h3>
                    <p className="text-sm text-ink-muted mt-0.5">{state.provider_count} providers &middot; {state.city_count} cities</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Popular Cities ─── */}
      <section className="py-20 sm:py-24 bg-section-alt">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <AnimatedSection className="mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink">Popular cities</h2>
              <p className="mt-3 text-ink-muted text-lg">Top cities with the most pelvic floor therapists.</p>
            </div>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" staggerDelay={0.05}>
            {topCities.map((city) => (
              <StaggerItem key={`${city.state_slug}-${city.city_slug}`}>
                <Link href={cityRoute(city.state_slug, city.city_slug)} className="card group/city p-5 flex items-start gap-3 h-full">
                  <MapPin size={18} className="text-gold-400 shrink-0 mt-0.5 group-hover/city:text-rose-400 transition-colors" />
                  <div>
                    <h3 className="font-semibold text-ink group-hover/city:text-rose-500 transition-colors">{city.city}</h3>
                    <p className="text-sm text-ink-muted mt-0.5">{city.provider_count} providers</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Featured Providers ─── */}
      {featuredProviders.length > 0 && (
        <section className="py-20 sm:py-24 bg-section-alt">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-ink">Featured providers</h2>
              <p className="mt-3 text-ink-muted text-lg max-w-2xl mx-auto">Qualified pelvic floor specialists ready to help you.</p>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
              {featuredProviders.map((provider, i) => (
                <StaggerItem key={provider.slug}>
                  <ProviderCard provider={provider} index={i} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            <AnimatedSection className="mt-10 text-center">
              <Link href={statesIndexRoute()} className="btn-primary inline-flex">
                <span>Browse all providers</span>
                <ArrowRight size={16} />
              </Link>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── FAQ / SEO Content ─── */}
      <section className="py-20 sm:py-24 bg-section-gradient">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink">Frequently asked questions</h2>
          </AnimatedSection>

          <StaggerContainer className="space-y-6" staggerDelay={0.08}>
            {[
              { q: 'What is pelvic floor physical therapy?', a: 'Pelvic floor physical therapy is a specialized form of physical therapy that focuses on the muscles, ligaments, and connective tissues of the pelvic floor. These muscles support your bladder, uterus, and rectum. A pelvic floor PT can help with conditions like incontinence, pelvic pain, prolapse, and postpartum recovery.' },
              { q: 'Do I need a referral to see a pelvic floor therapist?', a: 'In California, you can see a physical therapist through direct access without a physician referral for up to 45 days or 12 visits. However, some insurance plans may require a referral for coverage. Check with your provider and insurance plan.' },
              { q: 'What should I expect at my first appointment?', a: 'Your first visit typically includes a detailed health history, discussion of your symptoms and goals, and a physical assessment. The therapist may perform an external and/or internal examination of your pelvic floor muscles with your consent. They will create a personalized treatment plan.' },
              { q: 'Does insurance cover pelvic floor physical therapy?', a: 'Many insurance plans cover pelvic floor physical therapy when deemed medically necessary. Coverage varies by plan. We list accepted insurance for each provider when available — contact the provider directly to verify your specific coverage.' },
              { q: 'Is pelvic floor therapy only for women?', a: 'No! While pelvic floor therapy is commonly associated with women, men can benefit too. Conditions like post-prostatectomy incontinence, chronic pelvic pain, and erectile dysfunction can all be treated with pelvic floor physical therapy.' },
            ].map((faq, i) => (
              <StaggerItem key={i}>
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-ink">{faq.q}</h3>
                  <p className="mt-3 text-ink-muted leading-relaxed">{faq.a}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-24 bg-section-alt">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink">Ready to find your therapist?</h2>
            <p className="mt-4 text-lg text-ink-muted">Search our directory of {totalProviders}+ qualified pelvic floor physical therapists across {states.length} states.</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={statesIndexRoute()} className="btn-primary">
                <span>Browse providers</span>
                <ArrowRight size={16} />
              </Link>
              <Link href={specialtiesIndexRoute()} className="btn-secondary">
                <span>Explore specialties</span>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Homepage JSON-LD ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'FindaPelvicPT',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com',
            description: 'Find specialized pelvic floor physical therapists near you.',
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com'}/api/search?q={search_term_string}` },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* ─── FAQ JSON-LD ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'What is pelvic floor physical therapy?', acceptedAnswer: { '@type': 'Answer', text: 'Pelvic floor physical therapy is a specialized form of physical therapy that focuses on the muscles, ligaments, and connective tissues of the pelvic floor.' } },
              { '@type': 'Question', name: 'Do I need a referral to see a pelvic floor therapist?', acceptedAnswer: { '@type': 'Answer', text: 'In California, you can see a physical therapist through direct access without a physician referral for up to 45 days or 12 visits.' } },
              { '@type': 'Question', name: 'What should I expect at my first appointment?', acceptedAnswer: { '@type': 'Answer', text: 'Your first visit typically includes a detailed health history, discussion of your symptoms and goals, and a physical assessment.' } },
              { '@type': 'Question', name: 'Does insurance cover pelvic floor physical therapy?', acceptedAnswer: { '@type': 'Answer', text: 'Many insurance plans cover pelvic floor physical therapy when deemed medically necessary. Coverage varies by plan.' } },
              { '@type': 'Question', name: 'Is pelvic floor therapy only for women?', acceptedAnswer: { '@type': 'Answer', text: 'No! Men can benefit too. Conditions like post-prostatectomy incontinence, chronic pelvic pain, and erectile dysfunction can all be treated.' } },
            ],
          }),
        }}
      />
    </>
  );
}
