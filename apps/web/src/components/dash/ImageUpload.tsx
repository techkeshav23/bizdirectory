'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Input } from '@/components/ui/input';

type Kind = 'logo' | 'cover' | 'product' | 'gallery';
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

interface PresignResponse {
  uploadUrl: string | null;
  publicUrl: string;
  key: string;
}

/**
 * Image picker: presign -> PUT to R2/S3 -> returns the public URL. If storage
 * isn't configured (presign returns uploadUrl:null) it gracefully falls back to
 * a manual URL field so the flow still works.
 */
export function ImageUpload({
  value,
  onChange,
  kind,
  businessId,
  aspect = 'square',
}: {
  value: string;
  onChange: (url: string) => void;
  kind: Kind;
  businessId?: string;
  aspect?: 'square' | 'wide';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [manual, setManual] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return setErr('Use a JPG, PNG or WebP image.');
    if (file.size > 5 * 1024 * 1024) return setErr('Image must be under 5MB.');
    setErr('');
    setBusy(true);
    try {
      const res = await clientApi<PresignResponse>('POST', '/uploads/presign', {
        contentType: file.type,
        kind,
        businessId,
      });
      if (!res.uploadUrl) {
        // Storage not configured yet — let the owner paste a URL instead.
        setManual(true);
        return;
      }
      const put = await fetch(res.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'content-type': file.type },
      });
      if (!put.ok) throw new Error('Upload failed. Try again.');
      onChange(res.publicUrl);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const box = aspect === 'wide' ? 'h-24 w-full' : 'size-24';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div
          className={`${box} shrink-0 overflow-hidden rounded-[var(--radius)] border border-border bg-muted`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/40">
              <Upload className="size-5" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" /> Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          className="hidden"
          onChange={onPick}
        />
      </div>
      {manual && (
        <Input
          placeholder="Paste an image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
