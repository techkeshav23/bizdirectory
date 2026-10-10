import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tagProduct } from '@app/types';
import { apiGet, ApiError } from '@/lib/api';
import type { ProductDto } from '@/lib/types';
import { publicEnv } from '@/env';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { ContactButtons } from '@/components/directory/ContactButtons';
import { JsonLd } from '@/components/seo/JsonLd';
import { inr } from '@/lib/utils';

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return [] as { slug: string }[];
}

interface ProductDetail extends ProductDto {
  business: {
    id: string;
    name: string;
    slug: string;
    contactPhone: string;
    whatsappNumber: string | null;
  };
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await apiGet<ProductDetail>(`/products/${slug}`, {
      tags: [tagProduct(slug)],
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
  const product = await getProduct(slug);
  if (!product) return { title: 'Product' };
  const title = `${product.name} by ${product.business.name}`;
  return {
    title,
    description: product.description?.slice(0, 160) ?? `Enquire about ${product.name}.`,
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <article>
      <Breadcrumbs
        items={[
          { name: product.business.name, href: `/business/${product.business.slug}` },
          { name: product.name, href: `/product/${product.slug}` },
        ]}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description ?? undefined,
          image: product.images[0]?.url,
          ...(product.price !== null
            ? {
                offers: {
                  '@type': 'Offer',
                  price: product.price,
                  priceCurrency: product.currency,
                  availability: 'https://schema.org/InStock',
                  url: `${publicEnv.siteUrl}/product/${product.slug}`,
                },
              }
            : {}),
        }}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <div className="grain flex h-80 items-center justify-center overflow-hidden rounded-card border border-line bg-paper-2 shadow-[var(--shadow-card)]">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-muted">No image</span>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <Link
            href={`/business/${product.business.slug}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {product.business.name}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            {product.name}
          </h1>
          {product.price !== null && (
            <p className="mt-4 font-display text-3xl font-semibold text-brand-600">
              {inr(product.price)}
              {product.priceUnit ? (
                <span className="text-lg font-normal text-muted"> / {product.priceUnit}</span>
              ) : null}
            </p>
          )}
          {product.description && (
            <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}
          <div className="mt-7">
            <ContactButtons
              businessId={product.business.id}
              businessName={product.business.name}
              phone={product.business.contactPhone}
              whatsapp={product.business.whatsappNumber}
              productName={product.name}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
