'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  page: number; // 1-based
  pageCount: number;
  total?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, pageCount, total, pageSize, onPageChange }: Props) {
  if (pageCount <= 1 && !total) return null;
  const from = total && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = total && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <div className="text-muted-foreground">
        {total !== undefined && from !== null
          ? `Showing ${from}–${to} of ${total}`
          : `Page ${page} of ${pageCount}`}
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
