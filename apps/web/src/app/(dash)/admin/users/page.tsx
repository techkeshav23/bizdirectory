'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users as UsersIcon, Ban, ShieldCheck } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, DataTable, ErrorState, type Column } from '@/components/shared';
import { toast } from '@/components/ui/sonner';

interface AdminUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  role: 'customer' | 'business_owner' | 'admin';
  status: 'active' | 'blocked';
  isPhoneVerified: boolean;
  createdAt: string;
  _count: { businesses: number };
}

const ROLE_VARIANT: Record<string, 'success' | 'warning' | 'muted'> = {
  admin: 'success',
  business_owner: 'warning',
  customer: 'muted',
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await clientApi<AdminUser[]>('GET', '/admin/users'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!term) return true;
      return (
        u.phone.toLowerCase().includes(term) ||
        (u.fullName ?? '').toLowerCase().includes(term) ||
        (u.email ?? '').toLowerCase().includes(term)
      );
    });
  }, [items, roleFilter, q]);

  async function patch(u: AdminUser, body: { role?: string; status?: string }) {
    setBusyId(u.id);
    try {
      await clientApi('PATCH', `/admin/users/${u.id}`, body);
      setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...body } as AdminUser : x)));
      toast.success('User updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div>
          <div className="font-medium text-foreground">{u.fullName || u.phone}</div>
          <div className="text-xs text-muted-foreground">
            {u.phone}
            {u.email ? ` · ${u.email}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'biz',
      header: 'Listings',
      hideOnMobile: true,
      cell: (u) => <span className="text-muted-foreground">{u._count.businesses}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => (
        <Select
          value={u.role}
          onValueChange={(v) => patch(u, { role: v })}
          disabled={busyId === u.id}
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="business_owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <Badge variant={u.status === 'active' ? 'success' : 'destructive'}>{u.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (u) =>
        u.status === 'active' ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === u.id}
            onClick={() => patch(u, { status: 'blocked' })}
          >
            <Ban className="size-3.5" /> Block
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === u.id}
            onClick={() => patch(u, { status: 'active' })}
          >
            <ShieldCheck className="size-3.5" /> Unblock
          </Button>
        ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader icon={UsersIcon} title="Users" description="Manage platform users and roles." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={roleFilter} onValueChange={setRoleFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="customer">Customers</TabsTrigger>
            <TabsTrigger value="business_owner">Owners</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search phone, name, email…"
          className="h-9 w-full sm:w-64"
        />
      </div>

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          getRowKey={(u) => u.id}
          empty={<span className="text-muted-foreground">No users match.</span>}
        />
      )}
    </div>
  );
}
