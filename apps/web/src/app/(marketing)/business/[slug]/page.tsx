import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { tagBusiness } from '@app/types';
import { apiGet, ApiError } from '@/lib/api';
import type { BusinessDetailDto } from '@/lib/types';
import { publicEnv } from '@/env';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { ContactButtons } from '@/components/directory/ContactButtons';
import { MobileContactBar } from '@/components/directory/MobileContactBar';
import { TrustSection } from '@/components/directory/TrustSection';
import { SaveButton } from '@/components/directory/SaveButton';
import { ReviewForm } from '@/components/directory/ReviewForm';
import { RatingStars } from '@/components/directory/RatingStars';
import { VerifiedBadge } from '@/components/directory/VerifiedBadge';
import { JsonLd } from '@/components/seo/JsonLd';
import { inr } from '@/lib/utils';

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return [] as { slug: string }[];
}

async function getBusiness(slug: string): Promise<BusinessDetailDto | null> {
  try {
    return await apiGet<BusinessDetailDto>(`/businesses/${slug}`, {
      tags: ['business', tagBusiness(slug)],
      revalidate: 86400,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business || business.redirectTo) return { title: 'Business' };
  const title = `${business.name} — ${business.primaryCategory.name} in ${business.location.name}`;
  return {
    title,
    description:
      business.description?.slice(0, 160) ??
      `Contact ${business.name}, a ${business.primaryCategory.name} in ${business.location.name}. Call or WhatsApp directly on BizDirectory.`,
    alternates: { canonical: `/business/${business.slug}` },
    openGraph: { title, type: 'website' },
  };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();
  if (business.redirectTo) redirect(`/business/${business.redirectTo}`);

  return (
    <article className="animate-rise pb-24 md:pb-0">
      <Breadcrumbs
        items={[
          { name: business.primaryCategory.name, href: `/category/${business.primaryCategory.slug}` },
          { name: business.location.name, href: `/location/${business.location.slug}` },
          { name: business.name, href: `/business/${business.slug}` },
        ]}
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: business.name,
          description: business.description ?? undefined,
          telephone: business.contactPhone,
          image: business.logoUrl ?? undefined,
          url: `${publicEnv.siteUrl}/business/${business.slug}`,
          address: {
            '@type': 'PostalAddress',
            streetAddress: business.address ?? undefined,
            addressLocality: business.location.name,
            addressCountry: 'IN',
          },
          ...(business.ratingCount > 0
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: business.ratingAvg,
                  reviewCount: business.ratingCount,
                },
              }
            : {}),
        }}
      />

      {/* Hero card with cover */}
      <div className="overflow-hidden rounded-card border border-line bg-card shadow-[var(--shadow-card)]">
        <div
          className="grain h-36 w-full bg-forest sm:h-44"
          style={
            business.coverUrl
              ? { backgroundImage: `url(${business.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        />
        <div className="relative px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-paper-2 font-display text-4xl font-semibold text-brand-600 ring-4 ring-white shadow-md">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
            ) : (
              business.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                  {business.name}
                </h1>
                <VerifiedBadge status={business.gstinStatus} />
              </div>
              <p className="mt-1.5 text-ink-soft">
                {business.primaryCategory.name} · {business.location.name}
              </p>
              {business.ratingCount > 0 && (
                <div className="mt-2.5">
                  <RatingStars value={business.ratingAvg} count={business.ratingCount} />
                </div>
              )}
            </div>
            <SaveButton businessId={business.id} />
          </div>
          <div className="mt-5">
            <ContactButtons
              businessId={business.id}
              businessName={business.name}
              phone={business.contactPhone}
              whatsapp={business.whatsappNumber}
            />
          </div>
        </div>
      </div>

      {business.description && (
        <section className="mt-6 rounded-card border border-line bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h2 className="rule-accent font-display text-xl font-semibold text-ink">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">
            {business.description}
          </p>
          {business.legalName && (
            <p className="mt-4 text-sm text-muted">Registered as: {business.legalName}</p>
          )}
        </section>
      )}

      <TrustSection
        gstinStatus={business.gstinStatus}
        legalName={business.legalName}
        locationName={business.location.name}
        address={business.address}
        website={business.website}
      />

      {business.products.length > 0 && (
        <section className="mt-6">
          <h2 className="rule-accent mb-5 font-display text-2xl font-semibold tracking-tight text-ink">
            Products &amp; Services
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {business.products.map((p) => (
              <div
                key={p.id}
                className="group overflow-hidden rounded-card border border-line bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="flex h-40 items-center justify-center overflow-hidden bg-paper-2">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-muted">No image</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-ink">{p.name}</h3>
                  {p.price !== null && (
                    <p className="mt-1 font-display text-lg font-semibold text-brand-600">
                      {inr(p.price)}
                      {p.priceUnit ? <span className="text-sm text-muted"> / {p.priceUnit}</span> : null}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-8 rounded-card border border-line bg-card p-6 shadow-[var(--shadow-card)] sm:p-8 md:grid-cols-2">
        <div>
          <h2 className="rule-accent mb-4 font-display text-xl font-semibold text-ink">
            Reviews {business.ratingCount > 0 ? `(${business.ratingCount})` : ''}
          </h2>
          {business.reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet. Be the first to review.</p>
          ) : (
            <ul className="space-y-4">
              {business.reviews.map((r) => (
                <li key={r.id} className="border-b border-line pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-500">{'★'.repeat(r.rating)}</span>
                    <span className="text-sm font-medium text-ink">
                      {r.user.fullName ?? 'Customer'}
                    </span>
                  </div>
                  {r.body && <p className="mt-1 text-sm text-ink-soft">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="rule-accent mb-4 font-display text-xl font-semibold text-ink">
            Write a review
          </h2>
          <ReviewForm businessId={business.id} />
        </div>
      </section>

      <MobileContactBar
        businessId={business.id}
        businessName={business.name}
        phone={business.contactPhone}
        whatsapp={business.whatsappNumber}
      />
    </article>
  );
}
