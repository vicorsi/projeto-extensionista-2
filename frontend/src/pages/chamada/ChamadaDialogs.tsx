import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GroupedList } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSubtitle,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/tabs';
import { LoadingState } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';
import { aulasApi, membrosApi, planosApi } from '@/lib/services';
import type { Aula, Membro, PlanoLicao, TipoMembro } from '@/lib/types';
import { cn, formatDataCurta, formatMoeda, statusAulaLabel } from '@/lib/utils';

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classeId: string;
  classeNome: string;
}

function Vazio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="py-10 text-center">
      <p className="font-semibold">{titulo}</p>
      {texto && <p className="mx-auto mt-1 max-w-xs text-[14px] text-muted-foreground">{texto}</p>}
    </div>
  );
}

const linha = 'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.03] active:bg-black/[0.06]';

export function LicoesRevistaDialog({
  open,
  onOpenChange,
  classeId,
  classeNome,
  onSelecionar,
}: BaseProps & { onSelecionar: (p: PlanoLicao) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['planos', classeId],
    queryFn: () => planosApi.list(classeId),
    enabled: open && !!classeId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lições da revista</DialogTitle>
          <DialogSubtitle>{classeNome}</DialogSubtitle>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <LoadingState />
          ) : !data?.length ? (
            <Vazio titulo="Nenhuma lição cadastrada" texto="A superintendência pode cadastrar as lições do trimestre em Cadastros." />
          ) : (
            <GroupedList className="bg-ios-bg">
              {data.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => onSelecionar(p)} className={linha}>
                    <span className="tabular w-7 shrink-0 text-[15px] text-muted-foreground">{p.numeroLicao ?? '–'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">{p.titulo}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {[p.textoBiblico, p.dataSugerida && formatDataCurta(p.dataSugerida)].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </GroupedList>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function HistoricoDialog({
  open,
  onOpenChange,
  classeId,
  classeNome,
  dataAtual,
  onSelecionar,
}: BaseProps & { dataAtual: string; onSelecionar: (a: Aula) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['historico', classeId],
    queryFn: () => aulasApi.historico(classeId),
    enabled: open && !!classeId,
    staleTime: 0,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico</DialogTitle>
          <DialogSubtitle>{classeNome}</DialogSubtitle>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <LoadingState />
          ) : !data?.length ? (
            <Vazio titulo="Nenhuma aula registrada" />
          ) : (
            <GroupedList className="bg-ios-bg">
              {data.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => onSelecionar(a)} className={cn(linha, a.dataAula === dataAtual && 'bg-primary/[0.06]')}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">
                        {formatDataCurta(a.dataAula)}
                        <span className="text-muted-foreground"> · {statusAulaLabel(a.status)}</span>
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {a.numeroLicao ? `Lição ${a.numeroLicao} · ` : ''}
                        {a.temaLicao || 'Sem tema'}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-right text-[13px] text-muted-foreground">
                      {a.presentes} presentes
                      <br />
                      {formatMoeda(a.valorOferta)}
                    </span>
                  </button>
                </li>
              ))}
            </GroupedList>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function NovoAlunoDialog({
  open,
  onOpenChange,
  classeId,
  classeNome,
  onCriado,
}: BaseProps & { onCriado: (m: Membro, marcarPresente: boolean) => void }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoMembro>('VISITANTE');
  const [telefone, setTelefone] = useState('');
  const [presente, setPresente] = useState(true);

  useEffect(() => {
    if (open) {
      setNome('');
      setTelefone('');
      setTipo('VISITANTE');
      setPresente(true);
    }
  }, [open]);

  const criar = useMutation({
    mutationFn: () =>
      membrosApi.create({ nome: nome.trim(), classeId, tipoMembro: tipo, telefone: telefone.trim() || null, ativo: true }),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ['membros'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      toast(`${m.nome} adicionado(a)`);
      onCriado(m, presente);
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (nome.trim()) criar.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar à chamada</DialogTitle>
            <DialogSubtitle>{classeNome}</DialogSubtitle>
          </DialogHeader>
          <DialogBody className="grid gap-4">
            <Segmented
              value={tipo}
              onChange={setTipo}
              options={[
                { value: 'VISITANTE', label: 'Visitante' },
                { value: 'MEMBRO', label: 'Aluno' },
              ]}
            />
            <Field label="Nome" htmlFor="novo-nome">
              <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus required maxLength={150} />
            </Field>
            <Field label="Telefone (opcional)" htmlFor="novo-tel">
              <Input
                id="novo-tel"
                type="tel"
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={30}
              />
            </Field>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-ios-bg px-4 py-2.5">
              <Label htmlFor="novo-presente" className="cursor-pointer text-[15px] font-normal text-foreground">
                Marcar como presente
              </Label>
              <Switch id="novo-presente" checked={presente} onCheckedChange={setPresente} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={criar.isPending} disabled={!nome.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
