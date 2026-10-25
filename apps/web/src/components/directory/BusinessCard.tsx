import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { BusinessCardDto } from '@/lib/types';
import { RatingStars } from './RatingStars';
import { VerifiedBadge } from './VerifiedBadge';

export function BusinessCard({ business }: { business: BusinessCardDto }) {
  return (
    <Link
      href={`/business/${business.slug}`}
      className="group relative flex gap-4 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-4 transition-colors duration-200 hover:border-primary/40"
    >
      {(business.isSponsored || business.isFeatured) && (
        <span
          className={`absolute right-0 top-0 rounded-bl-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            business.isSponsored
              ? 'bg-gold/15 text-gold ring-1 ring-gold/25'
              : 'bg-accent text-accent-foreground'
          }`}
        >
          {business.isSponsored ? 'Sponsored' : 'Featured'}
        </span>
      )}
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-muted font-display text-xl font-bold text-primary ring-1 ring-border">
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={business.name}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          business.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1 pr-5">
        <h3 className="truncate font-display text-[15px] font-semibold leading-snug text-foreground">
          {business.name}
        </h3>
        <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
          <span className="truncate">{business.primaryCategory.name}</span>
          <span className="text-border">·</span>
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{business.location.name}</span>
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {business.ratingCount > 0 && (
            <RatingStars value={business.ratingAvg} count={business.ratingCount} />
          )}
          <VerifiedBadge status={business.gstinStatus} />
        </div>
      </div>
      <ArrowRight className="absolute bottom-4 right-4 size-4 text-muted-foreground/40 transition-all group-hover:right-3.5 group-hover:text-primary" />
    </Link>
  );
}
