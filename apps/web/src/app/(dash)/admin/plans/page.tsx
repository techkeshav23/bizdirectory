'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Plus, Pencil, Trash2 } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { inr } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PageHeader,
  DataTable,
  CrudFormDialog,
  ConfirmDialog,
  ErrorState,
  type Column,
} from '@/components/shared';
import { toast } from '@/components/ui/sonner';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  interval: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  _count: { subscriptions: number };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const emptyForm = {
  name: '',
  slug: '',
  price: 0,
  interval: 'yearly',
  features: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminPlansPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await clientApi<Plan[]>('GET', '/admin/plans'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: items.length });
    setDialogOpen(true);
  }

  function openEdit(p: Plan) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      interval: p.interval,
      features: (p.features ?? []).join('\n'),
      sortOrder: p.sortOrder,
      isActive: p.isActive,
    });
    setDialogOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        price: Number(form.price) || 0,
        interval: form.interval,
        features: form.features
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) await clientApi('PATCH', `/admin/plans/${editing.id}`, payload);
      else await clientApi('POST', '/admin/plans', payload);
      toast.success(editing ? 'Plan updated' : 'Plan created');
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await clientApi('DELETE', `/admin/plans/${del.id}`);
      toast.success('Plan deleted');
      setDel(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Plan>[] = [
    {
      key: 'name',
      header: 'Plan',
      cell: (p) => (
        <div>
          <div className="font-medium text-foreground">{p.name}</div>
          <div className="text-xs text-muted-foreground">/{p.slug}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      cell: (p) => (
        <span className="text-foreground">
          {Number(p.price) === 0 ? 'Free' : `${inr(Number(p.price))}/${p.interval === 'yearly' ? 'yr' : 'mo'}`}
        </span>
      ),
    },
    {
      key: 'features',
      header: 'Features',
      hideOnMobile: true,
      cell: (p) => <span className="text-muted-foreground">{(p.features ?? []).length}</span>,
    },
    {
      key: 'subs',
      header: 'Subscribers',
      hideOnMobile: true,
      cell: (p) => <span className="text-muted-foreground">{p._count.subscriptions}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <Badge variant={p.isActive ? 'success' : 'muted'}>{p.isActive ? 'Active' : 'Hidden'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDel(p)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        icon={CreditCard}
        title="Plans"
        description="Subscription plans businesses can buy for extra visibility."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New plan
          </Button>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          getRowKey={(p) => p.id}
          empty={<span className="text-muted-foreground">No plans yet.</span>}
        />
      )}

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={!!editing}
        createTitle="New plan"
        editTitle="Edit plan"
        isSubmitting={busy}
        onSubmit={save}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pname">Name</Label>
            <Input
              id="pname"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: editing ? f.slug : slugify(e.target.value),
                }))
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pslug">Slug</Label>
            <Input
              id="pslug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pprice">Price (₹)</Label>
            <Input
              id="pprice"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Interval</Label>
            <Select
              value={form.interval}
              onValueChange={(v) => setForm((f) => ({ ...f, interval: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pfeatures">Features (one per line)</Label>
          <Textarea
            id="pfeatures"
            rows={4}
            value={form.features}
            onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
            placeholder={'Verified badge\nFeatured listing\nAnalytics'}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="porder">Sort order</Label>
            <Input
              id="porder"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div className="flex items-center gap-2 pb-1 pt-7">
            <Switch
              id="pactive"
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
            <Label htmlFor="pactive" className="cursor-pointer">
              Active
            </Label>
          </div>
        </div>
      </CrudFormDialog>

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Delete "${del?.name ?? ''}"?`}
        description="Businesses subscribed to this plan may be affected. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isSubmitting={busy}
        onConfirm={remove}
      />
    </div>
  );
}
