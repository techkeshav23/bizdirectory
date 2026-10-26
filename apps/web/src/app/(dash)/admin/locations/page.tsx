'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

type LocType = 'state' | 'city' | 'area';

interface Loc {
  id: string;
  name: string;
  slug: string;
  type: LocType;
  parentId: string | null;
  pincode: string | null;
  parent: { name: string } | null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const emptyForm = { name: '', slug: '', type: 'city' as LocType, parentId: '', pincode: '' };

const TYPE_VARIANT: Record<LocType, 'success' | 'warning' | 'muted'> = {
  state: 'success',
  city: 'warning',
  area: 'muted',
};

export default function AdminLocationsPage() {
  const [items, setItems] = useState<Loc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Loc | null>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Loc | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await clientApi<Loc[]>('GET', '/locations/manage'));
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
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(l: Loc) {
    setEditing(l);
    setForm({
      name: l.name,
      slug: l.slug,
      type: l.type,
      parentId: l.parentId ?? '',
      pincode: l.pincode ?? '',
    });
    setDialogOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        type: form.type,
        parentId: form.parentId || null,
        pincode: form.pincode || null,
      };
      if (editing) await clientApi('PATCH', `/locations/${editing.id}`, payload);
      else await clientApi('POST', '/locations', payload);
      toast.success(editing ? 'Location updated' : 'Location created');
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
      await clientApi('DELETE', `/locations/${del.id}`);
      toast.success('Location deleted');
      setDel(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Parents: states (for cities) and cities (for areas), excluding self.
  const parentOptions = items.filter((l) => l.type !== 'area' && l.id !== editing?.id);

  const columns: Column<Loc>[] = [
    {
      key: 'name',
      header: 'Location',
      cell: (l) => (
        <div>
          <div className="font-medium text-foreground">{l.name}</div>
          <div className="text-xs text-muted-foreground">/{l.slug}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (l) => <Badge variant={TYPE_VARIANT[l.type]}>{l.type}</Badge>,
    },
    {
      key: 'parent',
      header: 'Parent',
      hideOnMobile: true,
      cell: (l) => <span className="text-muted-foreground">{l.parent?.name ?? '—'}</span>,
    },
    {
      key: 'pincode',
      header: 'PIN',
      hideOnMobile: true,
      cell: (l) => <span className="text-muted-foreground">{l.pincode ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (l) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDel(l)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        icon={MapPin}
        title="Locations"
        description="Manage states, cities and areas used across the directory."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New location
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
          getRowKey={(l) => l.id}
          empty={<span className="text-muted-foreground">No locations yet. Add a state or city.</span>}
        />
      )}

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={!!editing}
        createTitle="New location"
        editTitle="Edit location"
        isSubmitting={busy}
        onSubmit={save}
      >
        <div className="space-y-1.5">
          <Label htmlFor="lname">Name</Label>
          <Input
            id="lname"
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
          <Label htmlFor="lslug">Slug</Label>
          <Input
            id="lslug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="mumbai"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as LocType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lpin">PIN code</Label>
            <Input
              id="lpin"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              placeholder="optional"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Parent (state/city)</Label>
          <Select
            value={form.parentId || 'none'}
            onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === 'none' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {parentOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CrudFormDialog>

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Delete "${del?.name ?? ''}"?`}
        description="This cannot be undone. Businesses in this location may lose navigation paths."
        confirmLabel="Delete"
        variant="destructive"
        isSubmitting={busy}
        onConfirm={remove}
      />
    </div>
  );
}
