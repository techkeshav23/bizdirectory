import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Optional percentage trend vs previous period. */
  trend?: number;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, hint, className }: Props) {
  const up = (trend ?? 0) >= 0;
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {(trend !== undefined || hint) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {trend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                up ? 'text-success' : 'text-destructive',
              )}
            >
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
