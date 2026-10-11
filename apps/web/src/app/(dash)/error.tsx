'use client';

import { ErrorState } from '@/components/shared';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-10">
      <ErrorState onRetry={reset} />
    </div>
  );
}
