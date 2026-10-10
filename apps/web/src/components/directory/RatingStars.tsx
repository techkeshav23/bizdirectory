export function RatingStars({ value, count }: { value: number | string; count?: number }) {
  const v = typeof value === 'string' ? Number(value) : value;
  const rounded = Math.round(v * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="text-brand-500" aria-hidden>
        {'★'.repeat(Math.floor(rounded))}
        {rounded % 1 ? '½' : ''}
        {'☆'.repeat(Math.max(0, 5 - Math.ceil(rounded)))}
      </span>
      <span className="font-medium text-ink">{v.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  );
}
