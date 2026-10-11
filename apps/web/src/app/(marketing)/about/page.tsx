import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About', alternates: { canonical: '/about' } };

export default function AboutPage() {
  return (
    <div className="prose max-w-2xl">
      <h1 className="text-2xl font-bold">About BizDirectory</h1>
      <p className="mt-4 text-muted-foreground">
        BizDirectory is a B2B discovery platform that connects customers directly with verified
        Indian businesses — suppliers, manufacturers and service providers. Unlike traditional
        directories, we never resell leads: when you find a business, you call or WhatsApp them
        directly.
      </p>
    </div>
  );
}
