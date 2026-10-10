'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';

export function SaveButton({ businessId }: { businessId: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      if (saved) {
        await clientApi('DELETE', `/dashboard/saved/${businessId}`);
        setSaved(false);
      } else {
        await clientApi('POST', `/dashboard/saved/${businessId}`);
        setSaved(true);
      }
    } catch {
      window.location.href = `/login?next=/business`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={toggle} disabled={busy}>
      {saved ? '★ Saved' : '☆ Save'}
    </Button>
  );
}
