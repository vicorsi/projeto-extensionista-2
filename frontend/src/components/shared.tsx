import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSubtitle,
  DialogTitle,
} from '@/components/ui/dialog';
import { addDays, cn, copiarTexto, formatDataLonga, isDomingo, proximoDomingo, whatsappUrl } from '@/lib/utils';

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: ReactNode; title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        {eyebrow && <p className="truncate text-[13px] font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="truncate text-[28px] font-bold leading-tight tracking-tightest sm:text-[34px]">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-14 text-[15px] text-muted-foreground">
      <Spinner />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl bg-card px-6 py-12 text-center', className)}>
      <p className="text-[17px] font-semibold">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-[15px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Grade de métricas em um único cartão, separadas por linhas finas. */
export function Metrics({ items, className }: { items: { label: string; value: ReactNode; hint?: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ios-separator lg:grid-cols-4', className)}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0 bg-card px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="truncate text-[13px] text-muted-foreground">{i.label}</p>
          <p className="tabular mt-1 truncate text-[28px] font-semibold leading-none tracking-tight">{i.value}</p>
          {i.hint && <p className="mt-1.5 truncate text-[12px] text-muted-foreground">{i.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  destructive = false,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <DialogBody className="text-[15px] text-muted-foreground">{description}</DialogBody>}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Texto pronto para compartilhar no WhatsApp. */
export function WhatsAppDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  texto,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  texto: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const ok = await copiarTexto(texto);
    if (ok) {
      setCopiado(true);
      toast('Texto copiado');
      setTimeout(() => setCopiado(false), 2000);
    } else {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogSubtitle>{subtitle}</DialogSubtitle>}
        </DialogHeader>
        <DialogBody>
          <Textarea
            readOnly
            value={texto}
            className="min-h-[300px] resize-none border-0 bg-ios-bg text-[14px] leading-relaxed sm:text-[14px]"
            onFocus={(e) => e.currentTarget.select()}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" asChild>
            <a href={whatsappUrl(texto)} target="_blank" rel="noreferrer">
              Abrir no WhatsApp
            </a>
          </Button>
          <Button onClick={copiar}>{copiado ? 'Copiado' : 'Copiar texto'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Navegação entre domingos. */
export function DomingoNavigator({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const proximo = proximoDomingo();
  const nota = value === proximo ? 'Próximo domingo' : !isDomingo(value) ? 'Esta data não é um domingo' : null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-3 pl-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-[17px] font-semibold tracking-tight">{formatDataLonga(value)}</p>
        <p className={cn('truncate text-[13px]', nota && !isDomingo(value) ? 'text-ios-orange-text' : 'text-muted-foreground')}>
          {nota ?? (value < proximo ? 'Domingo anterior' : 'Domingo futuro')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="icon" onClick={() => onChange(addDays(value, -7))} aria-label="Domingo anterior">
          ‹
        </Button>
        <Input
          type="date"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-9 flex-1 sm:w-40 sm:flex-none"
          aria-label="Selecionar data"
        />
        <Button variant="secondary" size="icon" onClick={() => onChange(addDays(value, 7))} aria-label="Próximo domingo">
          ›
        </Button>
        {value !== proximo && (
          <Button variant="plain" size="sm" onClick={() => onChange(proximo)}>
            Hoje
          </Button>
        )}
      </div>
    </div>
  );
}
