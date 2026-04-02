import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Globe,
  Mail,
  Video,
  MapPin,
  GraduationCap,
  Shield,
  Languages,
  Link2,
  ExternalLink,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';
import { getProviderBySlug, getProviders } from '@/lib/data';
import { formatPhone, deslugify, slugify } from '@/lib/utils';
import { providerRoute, stateRoute, cityRoute, specialtyRoute } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import AnimatedSection from '@/components/AnimatedSection';
import ProviderCard from '@/components/ProviderCard';

export const revalidate = 3600;

interface ProviderPageProps {
  params: Promise<{
    state: string;
    city: string;
    provider: string;
  }>;
}

/* ─── Metadata ─── */

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { provider: providerSlug } = await params;
  const provider = await getProviderBySlug(providerSlug);

  if (!provider) {
    return { title: 'Provider Not Found | FindaPelvicPT' };
  }

  const credentials = provider.credentials ? `, ${provider.credentials}` : '';
  const title = `${provider.display_name}${credentials} - Pelvic Floor Physical Therapist in ${provider.city}, ${provider.state} | FindaPelvicPT`;

  const description = provider.bio
    ? provider.bio.slice(0, 155).replace(/\s+\S*$/, '') + '...'
    : `${provider.display_name} is a pelvic floor physical therapist in ${provider.city}, ${provider.state}${provider.specialties.length > 0 ? ` specializing in ${provider.specialties.slice(0, 3).join(', ')}` : ''}. Find contact info, specialties, and more on FindaPelvicPT.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';
  const canonical = `${siteUrl}${providerRoute(provider.state_slug, provider.city_slug, provider.slug)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'profile',
      siteName: 'FindaPelvicPT',
    },
  };
}

/* ─── Avatar Color Helper ─── */

function getNameHash(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/* ─── Page Component ─── */

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { state, city, provider: providerSlug } = await params;
  const provider = await getProviderBySlug(providerSlug);

  if (!provider) {
    notFound();
  }

  const stateName = deslugify(state);
  const cityName = deslugify(city);
  const phone = formatPhone(provider.phone);
  const hueShift = (getNameHash(provider.display_name) * 47) % 360;
  const initials = getInitials(provider.display_name);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findapt.com';

  // Fetch related providers in the same city
  const relatedProviders = await getProviders({
    city_slug: provider.city_slug,
    state_slug: provider.state_slug,
    limit: 5,
  });
  const otherProviders = relatedProviders
    .filter((p) => p.id !== provider.id)
    .slice(0, 4);

  /* ─── JSON-LD Structured Data ─── */

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: `${provider.display_name}${provider.credentials ? `, ${provider.credentials}` : ''}`,
    description: provider.bio || `Pelvic floor physical therapist in ${provider.city}, ${provider.state}.`,
    url: `${siteUrl}${providerRoute(provider.state_slug, provider.city_slug, provider.slug)}`,
    ...(provider.phone && { telephone: provider.phone }),
    ...(provider.website && { sameAs: provider.website }),
    address: {
      '@type': 'PostalAddress',
      ...(provider.address && { streetAddress: provider.address }),
      addressLocality: provider.city,
      addressRegion: provider.state,
      ...(provider.zip && { postalCode: provider.zip }),
      addressCountry: 'US',
    },
    medicalSpecialty: provider.specialties.map((s) => s),
    ...(provider.specialties.length > 0 && {
      availableService: provider.specialties.map((s) => ({
        '@type': 'MedicalTherapy',
        name: s,
        serviceType: 'Pelvic Floor Physical Therapy',
      })),
    }),
    areaServed: {
      '@type': 'City',
      name: provider.city,
      containedInPlace: {
        '@type': 'State',
        name: provider.state,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-hero-gradient">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: stateName, href: stateRoute(state) },
              { label: cityName, href: cityRoute(state, city) },
              { label: provider.display_name },
            ]}
          />

          {/* ─── Hero Section ─── */}
          <AnimatedSection className="pb-8">
            <div className="card p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div
                  className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg,
                      hsl(${(340 + hueShift) % 360}, 60%, 68%) 0%,
                      hsl(${(340 + hueShift) % 360}, 50%, 56%) 100%)`,
                  }}
                  aria-hidden="true"
                >
                  {initials}
                </div>

                {/* Provider Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ink">
                    {provider.display_name}
                    {provider.credentials && (
                      <span className="text-ink-muted font-normal text-lg sm:text-xl ml-2">
                        {provider.credentials}
                      </span>
                    )}
                  </h1>

                  {(provider.title || provider.practice_name) && (
                    <p className="mt-1.5 text-base sm:text-lg text-ink-light">
                      {provider.title}
                      {provider.title && provider.practice_name && ' at '}
                      {provider.practice_name && (
                        <span className="font-medium">{provider.practice_name}</span>
                      )}
                    </p>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 mt-3 text-ink-muted">
                    <MapPin size={16} className="text-gold-400 shrink-0" />
                    <span>
                      {provider.address && `${provider.address}, `}
                      {provider.city}, {provider.state}
                      {provider.zip && ` ${provider.zip}`}
                    </span>
                  </div>

                  {/* Telehealth Badge */}
                  {provider.telehealth_available && (
                    <div className="mt-3">
                      <span className="tag tag-gold">
                        <Video size={14} />
                        Telehealth Available
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Contact Actions ─── */}
              <div className="mt-6 pt-6 border-t border-warm-200 flex flex-wrap gap-3">
                {phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="btn-primary"
                  >
                    <Phone size={16} />
                    <span>{phone}</span>
                  </a>
                )}

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Globe size={16} />
                    <span>Visit Website</span>
                    <ExternalLink size={14} />
                  </a>
                )}

                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className="btn-secondary"
                  >
                    <Mail size={16} />
                    <span>Email</span>
                  </a>
                )}

                {provider.linkedin_url && (
                  <a
                    href={provider.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Link2 size={16} />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>
          </AnimatedSection>

          {/* ─── Specialties ─── */}
          {provider.specialties.length > 0 && (
            <AnimatedSection delay={0.1} className="pb-8">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope size={20} className="text-rose-400" />
                  <h2 className="text-xl font-semibold text-ink">Specialties</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {provider.specialties.map((specialty) => (
                    <Link
                      key={specialty}
                      href={specialtyRoute(slugify(specialty))}
                      className="tag tag-rose hover:scale-[1.03] transition-transform"
                    >
                      {specialty}
                      <ChevronRight size={12} className="opacity-50" />
                    </Link>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* ─── Bio ─── */}
          {provider.bio && (
            <AnimatedSection delay={0.15} className="pb-8">
              <div className="card p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-ink mb-4">About</h2>
                <div className="text-ink-light leading-relaxed whitespace-pre-line">
                  {provider.bio}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* ─── Insurance ─── */}
          {provider.insurance_accepted.length > 0 && (
            <AnimatedSection delay={0.2} className="pb-8">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={20} className="text-mauve-400" />
                  <h2 className="text-xl font-semibold text-ink">Insurance Accepted</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {provider.insurance_accepted.map((insurance) => (
                    <span key={insurance} className="tag tag-mauve">
                      {insurance}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* ─── Languages ─── */}
          {provider.languages.length > 0 && (
            <AnimatedSection delay={0.25} className="pb-8">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Languages size={20} className="text-gold-400" />
                  <h2 className="text-xl font-semibold text-ink">Languages</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {provider.languages.map((language) => (
                    <span key={language} className="tag tag-gold">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* ─── Education ─── */}
          {provider.education && (
            <AnimatedSection delay={0.3} className="pb-8">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap size={20} className="text-rose-400" />
                  <h2 className="text-xl font-semibold text-ink">Education</h2>
                </div>
                <p className="text-ink-light leading-relaxed whitespace-pre-line">
                  {provider.education}
                </p>
              </div>
            </AnimatedSection>
          )}

          {/* ─── Related Providers ─── */}
          {otherProviders.length > 0 && (
            <AnimatedSection delay={0.35} className="pb-16">
              <h2 className="text-2xl font-bold text-ink mb-6">
                Other Providers in {cityName}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {otherProviders.map((p, i) => (
                  <ProviderCard key={p.id} provider={p} index={i} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href={cityRoute(state, city)}
                  className="btn-secondary"
                >
                  <span>View all providers in {cityName}</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </AnimatedSection>
          )}
        </div>
      </main>
    </>
  );
}
