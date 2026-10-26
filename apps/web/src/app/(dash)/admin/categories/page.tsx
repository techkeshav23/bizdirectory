'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  parent: { name: string } | null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const emptyForm = { name: '', slug: '', parentId: '', sortOrder: 0, isActive: true, iconUrl: '' };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await clientApi<Category[]>('GET', '/categories/manage'));
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

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ?? '',
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      iconUrl: c.iconUrl ?? '',
    });
    setDialogOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        iconUrl: form.iconUrl || null,
      };
      if (editing) await clientApi('PATCH', `/categories/${editing.id}`, payload);
      else await clientApi('POST', '/categories', payload);
      toast.success(editing ? 'Category updated' : 'Category created');
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
      await clientApi('DELETE', `/categories/${del.id}`);
      toast.success('Category deleted');
      setDel(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const parents = items.filter((c) => !c.parentId && c.id !== editing?.id);

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      cell: (c) => (
        <div>
          <div className="font-medium text-foreground">{c.name}</div>
          <div className="text-xs text-muted-foreground">/{c.slug}</div>
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Parent',
      hideOnMobile: true,
      cell: (c) => <span className="text-muted-foreground">{c.parent?.name ?? '—'}</span>,
    },
    {
      key: 'order',
      header: 'Order',
      hideOnMobile: true,
      cell: (c) => <span className="text-muted-foreground">{c.sortOrder}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <Badge variant={c.isActive ? 'success' : 'muted'}>{c.isActive ? 'Active' : 'Hidden'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDel(c)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        icon={FolderTree}
        title="Categories"
        description="Manage business categories and subcategories."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New category
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
          getRowKey={(c) => c.id}
          empty={<span className="text-muted-foreground">No categories yet. Add the first one.</span>}
        />
      )}

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={!!editing}
        createTitle="New category"
        editTitle="Edit category"
        isSubmitting={busy}
        onSubmit={save}
      >
        <div className="space-y-1.5">
          <Label htmlFor="cname">Name</Label>
          <Input
            id="cname"
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
          <Label htmlFor="cslug">Slug</Label>
          <Input
            id="cslug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="steel-metal-suppliers"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Parent category</Label>
          <Select
            value={form.parentId || 'none'}
            onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === 'none' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (top-level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level)</SelectItem>
              {parents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="corder">Sort order</Label>
            <Input
              id="corder"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div className="flex items-center gap-2 pb-1 pt-7">
            <Switch
              id="cactive"
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
            <Label htmlFor="cactive" className="cursor-pointer">
              Active
            </Label>
          </div>
        </div>
      </CrudFormDialog>

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Delete "${del?.name ?? ''}"?`}
        description="This cannot be undone. Businesses linked to it may lose navigation paths."
        confirmLabel="Delete"
        variant="destructive"
        isSubmitting={busy}
        onConfirm={remove}
      />
    </div>
  );
}
