import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex shrink-0 items-center rounded-full px-2 py-[1px] text-[12px] font-medium', {
  variants: {
    variant: {
      default: 'bg-ios-fill text-muted-foreground',
      secondary: 'bg-ios-fill text-muted-foreground',
      outline: 'border border-ios-separator text-muted-foreground',
      success: 'bg-ios-green/[0.12] text-ios-green-text',
      warning: 'bg-ios-orange/[0.14] text-ios-orange-text',
      info: 'bg-primary/10 text-primary',
      destructive: 'bg-ios-red/10 text-ios-red',
      violet: 'bg-ios-purple/[0.12] text-ios-purple',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
