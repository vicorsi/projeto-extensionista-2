import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';

export function Toolbar({
  busca,
  onBusca,
  placeholder = 'Buscar',
  filtros,
  onNovo,
  novoLabel,
}: {
  busca: string;
  onBusca: (v: string) => void;
  placeholder?: string;
  filtros?: ReactNode;
  onNovo: () => void;
  novoLabel: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input
          type="search"
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          placeholder={placeholder}
          className="h-10 flex-1 border-0 bg-ios-fill"
          aria-label="Buscar"
        />
        <Button onClick={onNovo} className="h-10 shrink-0">
          {novoLabel}
        </Button>
      </div>
      {filtros && <div className="grid grid-cols-2 gap-2 sm:flex">{filtros}</div>}
    </div>
  );
}

export function ItemRow({
  titulo,
  subtitulo,
  detalhe,
  onClick,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  detalhe?: ReactNode;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.03] active:bg-black/[0.06]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px]">{titulo}</span>
          {subtitulo && <span className="block truncate text-[13px] text-muted-foreground">{subtitulo}</span>}
        </span>
        {detalhe && <span className="shrink-0 text-[13px] text-muted-foreground">{detalhe}</span>}
        <span aria-hidden className="shrink-0 text-[20px] leading-none text-muted-foreground/50">
          ›
        </span>
      </button>
    </li>
  );
}

export function Contagem({ n, singular, plural }: { n: number; singular: string; plural: string }) {
  return (
    <p className="px-4 pb-1.5 text-[13px] text-muted-foreground">
      {n} {n === 1 ? singular : plural}
    </p>
  );
}

/** Formulário em modal; quando `onExcluir` é informado, mostra "Excluir" no rodapé. */
export function FormDialog({
  open,
  onOpenChange,
  titulo,
  onSubmit,
  salvando,
  onExcluir,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  titulo: string;
  onSubmit: () => void;
  salvando: boolean;
  onExcluir?: () => void;
  children: ReactNode;
}) {
  function enviar(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid gap-4">{children}</DialogBody>
          <DialogFooter>
            {onExcluir && (
              <Button type="button" variant="destructive-plain" onClick={onExcluir} className="sm:mr-auto">
                Excluir
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={salvando}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Fluxo de exclusão com confirmação. */
export function useExclusao<T extends { id: string }>({
  remover,
  invalidar,
  mensagem,
  aoExcluir,
}: {
  remover: (id: string) => Promise<void>;
  invalidar: QueryKey[];
  mensagem: string;
  aoExcluir?: () => void;
}) {
  const qc = useQueryClient();
  const [alvo, setAlvo] = useState<T | null>(null);
  const mutation = useMutation({
    mutationFn: (id: string) => remover(id),
    onSuccess: () => {
      invalidar.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      toast(mensagem);
      setAlvo(null);
      aoExcluir?.();
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Não foi possível excluir')),
  });

  function dialog(titulo: string, descricao: ReactNode) {
    return (
      <ConfirmDialog
        open={!!alvo}
        onOpenChange={(o) => !o && setAlvo(null)}
        title={titulo}
        description={descricao}
        confirmLabel="Excluir"
        destructive
        loading={mutation.isPending}
        onConfirm={() => alvo && mutation.mutate(alvo.id)}
      />
    );
  }

  return { alvo, pedir: setAlvo, dialog };
}
