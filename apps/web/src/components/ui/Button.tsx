import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'forest' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:translate-y-px';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-[0_6px_18px_-6px_rgba(209,87,14,0.6)] hover:bg-brand-600 hover:shadow-[0_8px_22px_-6px_rgba(209,87,14,0.7)]',
  forest: 'bg-forest text-[#f3ece0] hover:bg-forest-soft',
  outline: 'border border-line bg-paper/60 text-ink hover:border-ink/30 hover:bg-paper',
  ghost: 'text-ink hover:bg-paper-2',
  whatsapp: 'bg-[#1fa855] text-white hover:bg-[#188544]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

export function Button({ variant = 'primary', size = 'md', href, className, ...props }: Props) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {props.children}
      </Link>
    );
  }
  return <button className={classes} {...props} />;
}
