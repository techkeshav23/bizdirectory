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
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-500">Pricing</div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Plans for every business
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Start free. Upgrade to get verified, rank higher, and win more leads.
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = Number(plan.price);
          const highlight = plan.slug === 'gold';
          return (
            <div
              key={plan.id}
              className={`grain relative overflow-hidden rounded-card p-7 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1 ${
                highlight
                  ? 'bg-forest text-paper md:-mt-4 md:pb-12'
                  : 'border border-line bg-white'
              }`}
            >
              {highlight && (
                <div className="mb-3 inline-block rounded-full bg-brand-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                  Most popular
                </div>
              )}
              <h2 className={`font-display text-2xl font-semibold ${highlight ? 'text-paper' : 'text-ink'}`}>
                {plan.name}
              </h2>
              <p className="mt-3 font-display text-4xl font-semibold">
                {price === 0 ? 'Free' : inr(price)}
                {price > 0 && (
                  <span className={`text-base font-normal ${highlight ? 'text-[#b9cbc3]' : 'text-muted'}`}>
                    {' '}
                    /mo
                  </span>
                )}
              </p>
              <ul className={`mt-6 space-y-3 text-sm ${highlight ? 'text-[#dbe5df]' : 'text-ink-soft'}`}>
                {(plan.features ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className={highlight ? 'text-brand-400' : 'text-emerald-600'}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                href="/manage"
                variant={highlight ? 'primary' : 'outline'}
                className="mt-7 w-full"
              >
                {price === 0 ? 'Get started' : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-muted">
        Payments processed securely via Razorpay · You own 100% of your data.
      </p>
    </div>
  );
}
