import * as React from 'react';
import { cn } from '@/lib/utils';

const campo =
  'w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-base text-foreground transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-ios-bg disabled:text-muted-foreground sm:text-[15px]';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => <input type={type} ref={ref} className={cn(campo, 'h-11', className)} {...props} />,
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(campo, 'min-h-[88px] py-2.5', className)} {...props} />,
);
Textarea.displayName = 'Textarea';

/** Select nativo — no celular abre o seletor do próprio sistema. */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className={cn('relative w-full min-w-0', className)}>
      <select ref={ref} className={cn(campo, 'h-11 cursor-pointer appearance-none truncate pr-9')} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ),
);
NativeSelect.displayName = 'NativeSelect';

export { Input, Textarea, NativeSelect };
