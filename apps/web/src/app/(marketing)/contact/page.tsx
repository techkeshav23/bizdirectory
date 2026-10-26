import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Store, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Get in touch with the BizDirectory team for support, listings help, or feedback.',
  alternates: { canonical: '/contact' },
};

// Support address shown to users. Admin can change this later via settings.
const SUPPORT_EMAIL = 'support@bizdirectory.in';

export default function ContactPage() {
  return (
    <div className="animate-rise mx-auto max-w-2xl">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
          We&apos;re here to help
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Looking for a specific business? Use search. For platform support, listing help, or
          feedback, reach us below.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/40"
        >
          <Mail className="size-5 text-primary" />
          <h2 className="mt-3 font-medium text-foreground">Email support</h2>
          <p className="mt-1 text-sm text-muted-foreground">{SUPPORT_EMAIL}</p>
        </a>

        <Link
          href="/register"
          className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/40"
        >
          <Store className="size-5 text-primary" />
          <h2 className="mt-3 font-medium text-foreground">List your business</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a free listing in minutes.</p>
        </Link>
      </div>

      <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-muted/40 p-6">
        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-medium text-foreground">Want to contact a business?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Find them on BizDirectory and call or WhatsApp them directly — no forms, no waiting.
            </p>
            <Button href="/search" variant="outline" size="sm" className="mt-3">
              Browse businesses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
