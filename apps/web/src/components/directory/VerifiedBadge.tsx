import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ status }: { status: string }) {
  if (status !== 'verified' && status !== 'manual') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-xs font-semibold text-success ring-1 ring-success/25">
      <BadgeCheck className="size-3.5" />
      GSTIN Verified
    </span>
  );
}
