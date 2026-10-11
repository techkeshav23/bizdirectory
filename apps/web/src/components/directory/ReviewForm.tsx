'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';

export function ReviewForm({ businessId }: { businessId: string }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (done)
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Thanks! Your review will appear once approved.
      </p>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        void clientApi('POST', `/businesses/${businessId}/reviews`, { rating, body: body || undefined })
          .then(() => setDone(true))
          .catch((err) => {
            const m = (err as Error).message;
            setError(m.includes('401') ? 'Please log in to leave a review.' : m);
          })
          .finally(() => setBusy(false));
      }}
      className="space-y-3"
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? 'text-primary' : 'text-muted-foreground/40'}`}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience (optional)"
        className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  );
}
