import { BadgeCheck, PhoneCall, Lock, MapPin, Globe, ShieldCheck } from 'lucide-react';

interface Props {
  gstinStatus: string;
  legalName: string | null;
  locationName: string;
  address: string | null;
  website: string | null;
}

/** Trust & Verification panel — the credibility signal buyers look for on a B2B profile. */
export function TrustSection({ gstinStatus, legalName, locationName, address, website }: Props) {
  const verified = gstinStatus === 'verified';

  return (
    <section className="mt-6 rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
        <ShieldCheck className="size-5 text-primary" />
        Trust &amp; Verification
      </h2>

      {verified && (
        <div className="mt-4 flex items-start gap-3 rounded-[var(--radius)] bg-success/10 p-4 ring-1 ring-success/20">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-success">GSTIN Verified Business</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {legalName
                ? `Registered as ${legalName}. GST details confirmed by BizDirectory.`
                : 'GST registration confirmed by BizDirectory.'}
            </p>
          </div>
        </div>
      )}

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <TrustRow icon={PhoneCall} title="Contact directly">
          Call or WhatsApp the business — no middlemen, no lead reselling.
        </TrustRow>
        <TrustRow icon={Lock} title="Your number stays private">
          We never sell or share your contact details with third parties.
        </TrustRow>
        <TrustRow icon={MapPin} title="Location">
          {address ? address : locationName}
        </TrustRow>
        {website && (
          <TrustRow icon={Globe} title="Website">
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary underline-offset-2 hover:underline"
            >
              {website.replace(/^https?:\/\//, '')}
            </a>
          </TrustRow>
        )}
      </ul>
    </section>
  );
}

function TrustRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof PhoneCall;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-[var(--radius)] border border-border/60 bg-background/50 p-3.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
