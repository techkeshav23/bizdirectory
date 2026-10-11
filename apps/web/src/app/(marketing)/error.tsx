'use client';

import { ErrorState } from '@/components/shared';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-10">
      <ErrorState
        title="This page didn't load"
        description="Something went wrong while loading this page. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
