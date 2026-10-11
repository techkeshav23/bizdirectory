import * as React from 'react';
import Link from 'next/link';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_hsl(24_88%_44%/0.5)] hover:brightness-105',
        forest: 'bg-forest text-[#f3ece0] hover:brightness-110',
        outline: 'border border-border bg-background/60 text-foreground hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:brightness-95',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
        whatsapp: 'bg-[#1fa855] text-white hover:bg-[#188544]',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, href, asChild, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    if (href) {
      return (
        <Link href={href} className={classes}>
          {props.children}
        </Link>
      );
    }
    const Comp = asChild ? Slot : 'button';
    return <Comp className={classes} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
