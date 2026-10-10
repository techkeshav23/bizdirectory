'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { inr } from '@/lib/utils';

interface ProductItem {
  id: string;
  name: string;
  price: string | number | null;
  priceUnit: string | null;
  images: { url: string }[];
}
interface BusinessDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsappNumber: string | null;
  address: string | null;
  status: string;
  products: ProductItem[];
}

export default function ManageBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [biz, setBiz] = useState<BusinessDetail | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    void clientApi<BusinessDetail>('GET', `/businesses/manage/${id}`)
      .then(setBiz)
      .catch((e) => setError((e as Error).message));
  }
  useEffect(load, [id]);

  if (error)
    return (
      <div className="rounded-card border border-slate-200 bg-white p-6">
        <p className="text-muted">{error}</p>
        <Button href="/login?next=/manage" className="mt-4">
          Login
        </Button>
      </div>
    );
  if (!biz) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/manage" className="text-sm text-muted hover:text-ink">
            ← All businesses
          </Link>
          <h1 className="text-2xl font-bold">{biz.name}</h1>
        </div>
        {biz.status === 'draft' && (
          <Button
            onClick={() =>
              void clientApi('POST', `/businesses/${biz.id}/submit`)
                .then(() => {
                  setMsg('Submitted for review!');
                  load();
                })
                .catch((e) => setError((e as Error).message))
            }
          >
            Submit for review
          </Button>
        )}
      </div>
      {msg && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>}

      <ProfileEditor biz={biz} onSaved={() => { setMsg('Profile saved — public page is refreshing.'); load(); }} />
      <ProductManager biz={biz} onChange={load} />
    </div>
  );
}

function ProfileEditor({ biz, onSaved }: { biz: BusinessDetail; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: biz.name,
    description: biz.description ?? '',
    whatsappNumber: biz.whatsappNumber ?? '',
    address: biz.address ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  return (
    <section className="rounded-card border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold">Business profile</h2>
      {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Business name"
          className="h-10 rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500"
        />
        <input
          value={form.whatsappNumber}
          onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
          placeholder="WhatsApp number"
          className="h-10 rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500"
        />
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
          className="h-10 rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500 sm:col-span-2"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 sm:col-span-2"
        />
      </div>
      <Button
        className="mt-3"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          setErr('');
          void clientApi('PATCH', `/businesses/${biz.id}`, {
            name: form.name,
            description: form.description || undefined,
            whatsappNumber: form.whatsappNumber || undefined,
            address: form.address || undefined,
          })
            .then(onSaved)
            .catch((e) => setErr((e as Error).message))
            .finally(() => setSaving(false));
        }}
      >
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </section>
  );
}

function ProductManager({ biz, onChange }: { biz: BusinessDetail; onChange: () => void }) {
  const [form, setForm] = useState({ name: '', price: '', priceUnit: '', imageUrl: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function add() {
    setBusy(true);
    setErr('');
    try {
      await clientApi('POST', '/products', {
        businessId: biz.id,
        name: form.name,
        price: form.price ? Number(form.price) : undefined,
        priceUnit: form.priceUnit || undefined,
        imageUrls: form.imageUrl ? [form.imageUrl] : undefined,
      });
      setForm({ name: '', price: '', priceUnit: '', imageUrl: '' });
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await clientApi('DELETE', `/products/${id}`).then(onChange).catch((e) => setErr((e as Error).message));
  }

  return (
    <section className="rounded-card border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold">Products &amp; services ({biz.products.length})</h2>
      {err && <div className="mb-2 text-sm text-red-600">{err}</div>}

      <div className="mb-4 space-y-3">
        {biz.products.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded bg-slate-100">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <div className="font-medium">{p.name}</div>
                {p.price !== null && (
                  <div className="text-sm text-muted">
                    {inr(p.price)}
                    {p.priceUnit ? ` / ${p.priceUnit}` : ''}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => remove(p.id)} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        ))}
        {biz.products.length === 0 && <p className="text-sm text-muted">No products yet.</p>}
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <h3 className="mb-2 text-sm font-semibold">Add a product</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Product name"
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Image URL (optional)"
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.]/g, '') })}
            placeholder="Price (₹)"
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={form.priceUnit}
            onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
            placeholder="Unit (kg, piece…)"
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <Button size="sm" className="mt-2" disabled={busy || !form.name} onClick={add}>
          {busy ? 'Adding…' : '+ Add product'}
        </Button>
      </div>
    </section>
  );
}
