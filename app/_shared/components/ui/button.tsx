import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/_shared/lib/utils/cn';

// Hard-edged 2026 buttons that "press" into their offset shadow on hover.
const pressable =
  'border-2 font-black uppercase tracking-wide transition-[color,background-color,box-shadow,transform] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:shadow-none';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-button text-button-foreground hover:bg-button-hover',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-button-outline bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-button-secondary text-button-secondary-foreground hover:bg-button-secondary-hover',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // 2026: lime call to action on light surfaces
        cta: cn(
          pressable,
          'border-foreground bg-accent text-accent-foreground shadow-[4px_4px_0_hsl(var(--foreground))]'
        ),
        // 2026: dark action with a clay shadow on light surfaces
        ink: cn(
          pressable,
          'border-foreground bg-foreground text-background shadow-[4px_4px_0_hsl(var(--secondary))]'
        ),
        // 2026: lime action on dark surfaces
        'cta-dark': cn(
          pressable,
          'border-accent bg-accent text-accent-foreground shadow-[4px_4px_0_hsl(var(--secondary))]'
        ),
        // 2026: secondary outline on light surfaces
        line: 'border-2 border-foreground bg-transparent font-black uppercase tracking-wide hover:bg-foreground hover:text-background',
        // 2026: secondary outline on dark surfaces
        'line-dark':
          'border-2 border-background bg-transparent font-black uppercase tracking-wide text-background hover:bg-background hover:text-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-14 rounded-md px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
