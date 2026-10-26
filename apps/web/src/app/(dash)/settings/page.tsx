'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared';
import { toast } from '@/components/ui/sonner';

interface Me {
  phone: string;
  fullName: string | null;
  email: string | null;
  role: string;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clientApi<Me>('GET', '/users/me')
      .then((u) => {
        setMe(u);
        setFullName(u.fullName ?? '');
        setEmail(u.email ?? '');
      })
      .catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await clientApi('PATCH', '/users/me', {
        fullName: fullName || undefined,
        email: email || undefined,
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-rise max-w-xl">
      <PageHeader
        icon={SettingsIcon}
        title="Account settings"
        description="Manage your profile details."
      />

      <form
        onSubmit={save}
        className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={me?.phone ?? ''} disabled />
          <p className="text-xs text-muted-foreground">Phone is your login and cannot be changed here.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fn">Full name</Label>
          <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em">Email</Label>
          <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
