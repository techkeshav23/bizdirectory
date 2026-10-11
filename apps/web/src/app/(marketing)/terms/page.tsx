import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
        By listing a business you confirm the information is accurate and that you are authorised to
        represent it. BizDirectory facilitates discovery and direct contact but is not a party to any
        transaction between customers and businesses.
      </p>
    </div>
  );
}
