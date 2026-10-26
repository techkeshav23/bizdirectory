import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  description?: string;
  icon?: LucideIcon;
  backLink?: { href: string; label?: string };
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  backLink,
  breadcrumbs,
  actions,
  className,
}: Props) {
  return (
    <div className={cn('mb-8', className)}>
      {backLink && (
        <Link
          href={backLink.href}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {backLink.label ?? 'Back'}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_6px_18px_-6px_hsl(147_23%_23%/0.45)]">
              <Icon className="size-5" />
            </div>
          )}
          <div>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {breadcrumbs.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-border">/</span>}
                    {c.href ? (
                      <Link href={c.href} className="hover:text-foreground">
                        {c.label}
                      </Link>
                    ) : (
                      <span>{c.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            ) : null}
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description && !breadcrumbs && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
