import Link from 'next/link';
import { MapPin, Phone, Globe, Video, ArrowRight } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { formatPhone } from '@/lib/utils';
import { providerRoute } from '@/lib/routes';

interface ProviderCardProps {
  provider: Provider;
  index?: number;
}

export default function ProviderCard({ provider, index = 0 }: ProviderCardProps) {
  const providerHref = providerRoute(provider.state_slug, provider.city_slug, provider.slug);
  const phone = formatPhone(provider.phone);

  // Generate a warm hue rotation based on index for visual variety in initials avatar
  const hueShift = (index * 47) % 360;

  return (
    <article className="card group relative overflow-hidden">
      {/* Subtle top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, var(--color-rose-400), var(--color-gold-400))`,
        }}
      />

      <div className="p-6">
        <div className="flex gap-4">
          {/* Avatar / Initials */}
          <div
            className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg,
                hsl(${(340 + hueShift) % 360}, 60%, 68%) 0%,
                hsl(${(340 + hueShift) % 360}, 50%, 56%) 100%)`,
            }}
          >
            {provider.display_name
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            {/* Name */}
            <Link href={providerHref} className="block group/link">
              <h3 className="text-lg font-semibold text-ink group-hover/link:text-rose-500 transition-colors truncate">
                {provider.display_name}
                {provider.credentials && (
                  <span className="text-ink-muted font-normal text-sm ml-1.5">
                    {provider.credentials}
                  </span>
                )}
              </h3>
            </Link>

            {/* Title + Practice */}
            {provider.practice_name && (
              <p className="text-sm text-ink-muted mt-0.5 truncate">
                {provider.title && <span>{provider.title} at </span>}
                {provider.practice_name}
              </p>
            )}

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-2 text-sm text-ink-light">
              <MapPin size={14} className="text-gold-400 shrink-0" />
              <span className="truncate">
                {provider.city}, {provider.state}
                {provider.zip && ` ${provider.zip}`}
              </span>
            </div>
          </div>
        </div>

        {/* Specialties */}
        {provider.specialties.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {provider.specialties.slice(0, 5).map((specialty) => (
              <span key={specialty} className="tag tag-rose">
                {specialty}
              </span>
            ))}
            {provider.specialties.length > 5 && (
              <span className="tag tag-mauve">
                +{provider.specialties.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Action Row */}
        <div className="mt-5 pt-4 border-t border-warm-200 flex items-center gap-3 flex-wrap">
          {phone && (
            <a
              href={`tel:${provider.phone}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-light hover:text-rose-500 transition-colors"
            >
              <Phone size={14} />
              {phone}
            </a>
          )}

          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-light hover:text-rose-500 transition-colors"
            >
              <Globe size={14} />
              Website
            </a>
          )}

          {provider.telehealth_available && (
            <span className="tag tag-gold text-xs">
              <Video size={12} />
              Telehealth
            </span>
          )}

          <Link
            href={providerHref}
            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors group/arrow"
          >
            View Profile
            <ArrowRight
              size={14}
              className="group-hover/arrow:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
