'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Badge } from '@/components/ui/badge';
import { PageHeader, DataTable, ErrorState, type Column } from '@/components/shared';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setLogs(await clientApi<AuditLog[]>('GET', '/admin/audit-logs'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      cell: (l) => <Badge variant="muted">{l.action}</Badge>,
    },
    {
      key: 'entity',
      header: 'Entity',
      cell: (l) => (
        <span className="text-muted-foreground">
          {l.entityType}
          {l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ''}
        </span>
      ),
    },
    {
      key: 'when',
      header: 'When',
      align: 'right',
      cell: (l) => (
        <span className="text-muted-foreground">{new Date(l.createdAt).toLocaleString('en-IN')}</span>
      ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader icon={ScrollText} title="Audit log" description="Every admin action, recorded." />
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : (
        <DataTable columns={columns} data={logs} isLoading={loading} getRowKey={(l) => l.id} />
      )}
    </div>
  );
}
