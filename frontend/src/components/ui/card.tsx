import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-2xl bg-card text-card-foreground', className)} {...props} />
));
Card.displayName = 'Card';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-4 sm:p-5', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

/** Rótulo de seção no estilo das listas agrupadas do iOS. */
function SectionLabel({ className, children, action }: { className?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn('mb-1.5 flex items-end justify-between gap-2 px-4', className)}>
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

/** Lista agrupada (fundo branco, cantos arredondados, divisórias finas). */
const GroupedList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('overflow-hidden rounded-2xl bg-card [&>li+li]:border-t [&>li+li]:border-ios-separator', className)} {...props} />
  ),
);
GroupedList.displayName = 'GroupedList';

export { Card, CardContent, SectionLabel, GroupedList };
