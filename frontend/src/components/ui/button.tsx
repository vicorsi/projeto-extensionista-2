import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 active:opacity-70 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-ios-fill text-foreground hover:bg-ios-fill-hover',
        outline: 'bg-ios-fill text-foreground hover:bg-ios-fill-hover',
        plain: 'text-primary hover:bg-primary/[0.06]',
        ghost: 'text-foreground hover:bg-black/[0.05]',
        destructive: 'bg-ios-red text-white hover:bg-ios-red/90',
        'destructive-plain': 'text-ios-red hover:bg-ios-red/[0.06]',
        success: 'bg-ios-green text-white hover:bg-ios-green/90',
        link: 'h-auto px-0 text-primary hover:underline',
      },
      size: {
        default: 'h-11 px-5 text-[15px]',
        sm: 'h-8 px-3.5 text-[13px]',
        lg: 'h-12 px-6 text-[17px]',
        icon: 'h-9 w-9 text-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading && <Spinner className="h-3.5 w-3.5" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
