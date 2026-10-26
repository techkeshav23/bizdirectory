import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Important information about listings, verification and transactions on BizDirectory.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <div className="animate-rise mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Disclaimer</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          BizDirectory is a business discovery platform. We list businesses and help customers
          contact them directly. We are not a party to any transaction between a customer and a
          listed business.
        </p>
        <Section title="Listings & accuracy">
          Business information is provided by the businesses themselves. While we verify GSTIN where
          a &ldquo;Verified&rdquo; badge is shown, we do not independently guarantee the accuracy,
          quality, pricing, or availability of any product or service. Please verify details directly
          with the business before transacting.
        </Section>
        <Section title="Verification badge">
          A &ldquo;GSTIN Verified&rdquo; badge confirms only that the business provided a GSTIN whose
          format and registration we could validate. It is not an endorsement, certification of
          quality, or a guarantee of any kind.
        </Section>
        <Section title="Transactions">
          Any order, payment, delivery, or dispute is strictly between the customer and the business.
          BizDirectory does not process payments between customers and businesses and bears no
          responsibility for the outcome of any dealing.
        </Section>
        <Section title="Content & liability">
          We are not liable for any loss or damage arising from reliance on information on this
          platform. Reviews reflect the opinions of individual users, not BizDirectory.
        </Section>
        <p>
          By using BizDirectory you acknowledge and accept this disclaimer along with our{' '}
          <a href="/terms" className="text-primary hover:underline">Terms</a> and{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-medium text-foreground">{title}</h2>
      <p className="mt-1">{children}</p>
    </div>
  );
}
