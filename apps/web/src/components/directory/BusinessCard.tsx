import Link from 'next/link';
import type { BusinessCardDto } from '@/lib/types';
import { RatingStars } from './RatingStars';
import { VerifiedBadge } from './VerifiedBadge';

export function BusinessCard({ business }: { business: BusinessCardDto }) {
  return (
    <Link
      href={`/business/${business.slug}`}
      className="group relative flex gap-4 overflow-hidden rounded-card border border-line bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/50 hover:shadow-[var(--shadow-lift)]"
    >
      {(business.isSponsored || business.isFeatured) && (
        <span
          className={`absolute right-0 top-0 rounded-bl-xl px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            business.isSponsored ? 'bg-brand-500 text-white' : 'bg-forest text-[#e9e0cf]'
          }`}
        >
          {business.isSponsored ? 'Sponsored' : 'Featured'}
        </span>
      )}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-2 font-display text-2xl font-semibold text-brand-600 ring-1 ring-line">
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
        ) : (
          business.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1 pr-6">
        <h3 className="truncate font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand-600">
          {business.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-ink-soft">
          {business.primaryCategory.name} · {business.location.name}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {business.ratingCount > 0 && (
            <RatingStars value={business.ratingAvg} count={business.ratingCount} />
          )}
          <VerifiedBadge status={business.gstinStatus} />
        </div>
      </div>
    </Link>
  );
}
