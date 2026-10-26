import type { Metadata } from 'next';
import { apiGet } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { inr } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pricing — list and promote your business',
  description:
    'Simple plans for businesses on BizDirectory. Get a verified badge, more categories, and featured/sponsored placement to reach more customers.',
  alternates: { canonical: '/pricing' },
};

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  interval: string;
  features: string[];
}

export default async function PricingPage() {
  const plans = await apiGet<Plan[]>('/subscriptions/plans', { revalidate: 3600 }).catch(() => []);

  return (
    <div className="animate-rise">
      <div className="mb-12 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Plans for every business
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Start free. Upgrade to get verified, rank higher, and get discovered by more customers.
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = Number(plan.price);
          const highlight = plan.slug === 'gold';
          return (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-[var(--radius-card)] p-7 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1 ${
                highlight
                  ? 'bg-primary text-primary-foreground md:-mt-4 md:pb-12'
                  : 'border border-border bg-card'
              }`}
            >
              {highlight && (
                <div className="mb-3 inline-block rounded-full bg-primary-foreground/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                  Most popular
                </div>
              )}
              <h2
                className={`font-display text-2xl font-semibold ${
                  highlight ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {plan.name}
              </h2>
              <p className="mt-3 font-display text-4xl font-semibold">
                {price === 0 ? 'Free' : inr(price)}
                {price > 0 && (
                  <span
                    className={`text-base font-normal ${
                      highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {' '}
                    /mo
                  </span>
                )}
              </p>
              <ul
                className={`mt-6 space-y-3 text-sm ${
                  highlight ? 'text-primary-foreground/90' : 'text-muted-foreground'
                }`}
              >
                {(plan.features ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className={highlight ? 'text-primary-foreground' : 'text-success'}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                href="/manage"
                variant={highlight ? 'secondary' : 'outline'}
                className="mt-7 w-full"
              >
                {price === 0 ? 'Get started' : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Payments processed securely via Razorpay · You own 100% of your data.
      </p>
    </div>
  );
}
