import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, BadgeCheck, PhoneCall, Store, ShieldCheck, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'How it works — find & contact verified businesses',
  description:
    'BizDirectory connects customers directly with verified B2B businesses across India. Search, compare, and call or WhatsApp — no middlemen, no lead reselling.',
  alternates: { canonical: '/how-it-works' },
};

const CUSTOMER_STEPS = [
  { icon: Search, title: 'Search', body: 'Find businesses by category and city — steel suppliers in Pune, packaging in Mumbai, and more.' },
  { icon: BadgeCheck, title: 'Compare verified listings', body: 'See GSTIN-verified businesses, ratings, products and prices at a glance.' },
  { icon: PhoneCall, title: 'Contact directly', body: 'Call or WhatsApp the business in one tap. Your number is never sold or shared.' },
];

const BUSINESS_STEPS = [
  { icon: Store, title: 'List for free', body: 'Create your listing with up to 3 products, photos, address and contact details.' },
  { icon: ShieldCheck, title: 'Get GSTIN-verified', body: 'Add your GSTIN to earn a verified badge that buyers trust.' },
  { icon: Ban, title: 'Own your customers', body: 'Enquiries come straight to you. We never resell leads or charge per contact.' },
];

export default function HowItWorksPage() {
  return (
    <div className="animate-rise mx-auto max-w-3xl">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
          Direct connections, no middlemen
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          BizDirectory is a discovery platform — customers find businesses and contact them directly.
          We don&apos;t sit between you and your customers.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-foreground">For customers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {CUSTOMER_STEPS.map((s, i) => (
            <Step key={s.title} n={i + 1} {...s} />
          ))}
        </div>
        <div className="mt-6">
          <Button href="/search">Start searching</Button>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold text-foreground">For businesses</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {BUSINESS_STEPS.map((s, i) => (
            <Step key={s.title} n={i + 1} {...s} />
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button href="/register">List your business</Button>
          <Button href="/pricing" variant="outline">
            See pricing
          </Button>
        </div>
      </section>

      <p className="mt-14 text-center text-sm text-muted-foreground">
        Questions? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>.
      </p>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: number;
  icon: typeof Search;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">Step {n}</span>
      </div>
      <h3 className="mt-3 font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
