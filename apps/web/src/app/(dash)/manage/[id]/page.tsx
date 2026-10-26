'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { Store, Trash2, Plus, Send } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, ErrorState, DeleteConfirmDialog, CardSkeleton } from '@/components/shared';
import { toast } from '@/components/ui/sonner';
import { UpgradeDialog } from '@/components/billing/UpgradeDialog';
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
  subscriptionTier?: string | null;
  products: ProductItem[];
}

export default function ManageBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [biz, setBiz] = useState<BusinessDetail | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    clientApi<BusinessDetail>('GET', `/businesses/manage/${id}`)
      .then(setBiz)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  useEffect(load, [load]);

  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!biz) return <CardSkeleton />;

  return (
    <div className="animate-rise">
      <PageHeader
        icon={Store}
        title={biz.name}
        backLink={{ href: '/manage', label: 'All businesses' }}
        actions={
          biz.status === 'draft' ? (
            <Button
              onClick={() =>
                clientApi('POST', `/businesses/${biz.id}/submit`)
                  .then(() => {
                    toast.success('Submitted for review');
                    load();
                  })
                  .catch((e) => toast.error((e as Error).message))
              }
            >
              <Send /> Submit for review
            </Button>
          ) : (
            <Badge
              variant={biz.status === 'active' ? 'success' : 'warning'}
            >
              {biz.status.replace('_', ' ')}
            </Badge>
          )
        }
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="products">Products ({biz.products.length})</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileEditor biz={biz} onSaved={load} />
        </TabsContent>
        <TabsContent value="products">
          <ProductManager biz={biz} onChange={load} />
        </TabsContent>
        <TabsContent value="plan">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Current plan: <span className="font-medium text-foreground">{biz.subscriptionTier ?? 'free'}</span>
              </p>
              <UpgradeDialog
                businessId={biz.id}
                businessName={biz.name}
                currentTier={biz.subscriptionTier}
                onDone={load}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Business name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp number</Label>
            <Input
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <Button
          disabled={saving || !form.name.trim()}
          onClick={() => {
            if (!form.name.trim()) return;
            setSaving(true);
            clientApi('PATCH', `/businesses/${biz.id}`, {
              name: form.name,
              description: form.description || undefined,
              whatsappNumber: form.whatsappNumber || undefined,
              address: form.address || undefined,
            })
              .then(() => {
                toast.success('Profile saved — public page is refreshing');
                onSaved();
              })
              .catch((e) => toast.error((e as Error).message))
              .finally(() => setSaving(false));
          }}
        >
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductManager({ biz, onChange }: { biz: BusinessDetail; onChange: () => void }) {
  const [form, setForm] = useState({ name: '', price: '', priceUnit: '', imageUrl: '' });
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<ProductItem | null>(null);

  async function add() {
    setBusy(true);
    try {
      await clientApi('POST', '/products', {
        businessId: biz.id,
        name: form.name,
        price: form.price ? Number(form.price) : undefined,
        priceUnit: form.priceUnit || undefined,
        imageUrls: form.imageUrl ? [form.imageUrl] : undefined,
      });
      setForm({ name: '', price: '', priceUnit: '', imageUrl: '' });
      toast.success('Product added');
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: ProductItem) {
    setBusy(true);
    try {
      await clientApi('DELETE', `/products/${p.id}`);
      toast.success('Product deleted');
      setDel(null);
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Products &amp; services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {biz.products.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
          {biz.products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-lg bg-muted">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt={p.name} className="size-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground">{p.name}</div>
                  {p.price !== null && (
                    <div className="text-sm text-muted-foreground">
                      {inr(p.price)}
                      {p.priceUnit ? ` / ${p.priceUnit}` : ''}
                    </div>
                  )}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setDel(p)} aria-label="Delete product">
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Image URL (optional)"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
            <Input
              placeholder="Price (₹)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.]/g, '') })}
            />
            <Input
              placeholder="Unit (kg, piece…)"
              value={form.priceUnit}
              onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
            />
          </div>
          <Button className="mt-3" disabled={busy || !form.name} onClick={add}>
            <Plus /> Add product
          </Button>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        itemName={del?.name ?? ''}
        isSubmitting={busy}
        onConfirm={() => del && remove(del)}
      />
    </div>
  );
}
