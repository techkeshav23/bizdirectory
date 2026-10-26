'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared';
import { toast } from '@/components/ui/sonner';

export default function AdminSeoPage() {
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clientApi<Record<string, string | null>>('GET', '/settings')
      .then((s) => {
        setMetaTitle(s['seo.metaTitle'] ?? '');
        setMetaDescription(s['seo.metaDescription'] ?? '');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await clientApi('PATCH', '/settings', {
        settings: {
          'seo.metaTitle': metaTitle || null,
          'seo.metaDescription': metaDescription || null,
        },
      });
      toast.success('SEO settings saved. Changes apply within a few minutes.');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-rise max-w-2xl">
      <PageHeader
        icon={Globe}
        title="SEO controls"
        description="Edit the site title and meta description shown in Google and social shares."
      />

      <form
        onSubmit={save}
        className="space-y-5 rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="mt">Site title (meta title)</Label>
          <Input
            id="mt"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="BizDirectory — Find & contact verified B2B businesses in India"
            maxLength={70}
          />
          <p className="text-xs text-muted-foreground">
            {metaTitle.length}/70 — browser tab + Google title. Leave blank for the default.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="md">Meta description</Label>
          <Textarea
            id="md"
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            maxLength={160}
            placeholder="Discover verified suppliers, manufacturers and service providers across India…"
          />
          <p className="text-xs text-muted-foreground">
            {metaDescription.length}/160 — the snippet under your title in search results.
          </p>
        </div>

        <Button type="submit" disabled={!loaded || saving}>
          {saving ? 'Saving…' : 'Save SEO settings'}
        </Button>
      </form>
    </div>
  );
}
