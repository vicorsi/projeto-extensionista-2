import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GroupedList } from '@/components/ui/card';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { EmptyState, LoadingState } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';
import { classesApi, planosApi } from '@/lib/services';
import type { PlanoLicao } from '@/lib/types';
import { formatDataCurta, normalizar } from '@/lib/utils';
import { Contagem, FormDialog, ItemRow, Toolbar, useExclusao } from './common';

interface FormLicao {
  classeId: string;
  numeroLicao: string;
  titulo: string;
  textoBiblico: string;
  dataSugerida: string;
}

export default function LicoesTab() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [filtroClasse, setFiltroClasse] = useState('');
  const [editando, setEditando] = useState<PlanoLicao | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormLicao>({ classeId: '', numeroLicao: '', titulo: '', textoBiblico: '', dataSugerida: '' });

  const classesQ = useQuery({ queryKey: ['classes'], queryFn: classesApi.list });
  const planosQ = useQuery({ queryKey: ['planos', 'todos'], queryFn: () => planosApi.list() });
  const classes = classesQ.data ?? [];

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (planosQ.data ?? []).filter(
      (p) =>
        (!filtroClasse || p.classeId === filtroClasse) &&
        (!termo || normalizar(`${p.titulo} ${p.textoBiblico ?? ''} ${p.numeroLicao ?? ''}`).includes(termo)),
    );
  }, [planosQ.data, busca, filtroClasse]);

  const salvar = useMutation({
    mutationFn: () => {
      const numero = form.numeroLicao.trim() ? Math.trunc(Number(form.numeroLicao)) : null;
      const payload = {
        classeId: form.classeId,
        numeroLicao: numero && numero > 0 ? numero : null,
        titulo: form.titulo.trim(),
        textoBiblico: form.textoBiblico.trim() || null,
        dataSugerida: form.dataSugerida || null,
      };
      return editando ? planosApi.update(editando.id, payload) : planosApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planos'] });
      toast(editando ? 'Alterações salvas' : 'Lição cadastrada');
      setAberto(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const exclusao = useExclusao<PlanoLicao>({
    remover: planosApi.remove,
    invalidar: [['planos']],
    mensagem: 'Lição excluída',
    aoExcluir: () => setAberto(false),
  });

  function abrir(p: PlanoLicao | null) {
    setEditando(p);
    if (p) {
      setForm({
        classeId: p.classeId,
        numeroLicao: p.numeroLicao?.toString() ?? '',
        titulo: p.titulo,
        textoBiblico: p.textoBiblico ?? '',
        dataSugerida: p.dataSugerida ?? '',
      });
    } else {
      const classeId = filtroClasse || classes[0]?.id || '';
      const proximo = Math.max(0, ...(planosQ.data ?? []).filter((x) => x.classeId === classeId).map((x) => x.numeroLicao ?? 0)) + 1;
      setForm({ classeId, numeroLicao: String(proximo), titulo: '', textoBiblico: '', dataSugerida: '' });
    }
    setAberto(true);
  }

  return (
    <div className="grid gap-4">
      <Toolbar
        busca={busca}
        onBusca={setBusca}
        novoLabel="Nova"
        onNovo={() => abrir(null)}
        filtros={
          <NativeSelect value={filtroClasse} onChange={(e) => setFiltroClasse(e.target.value)} className="col-span-2 sm:w-48" aria-label="Classe">
            <option value="">Todas as classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </NativeSelect>
        }
      />

      {planosQ.isLoading ? (
        <LoadingState />
      ) : !lista.length ? (
        <EmptyState
          title={planosQ.data?.length ? 'Nenhum resultado' : 'Nenhuma lição cadastrada'}
          description="Cadastre as lições da revista do trimestre para preencher a aula com um toque."
        />
      ) : (
        <div>
          <Contagem n={lista.length} singular="lição" plural="lições" />
          <GroupedList>
            {lista.map((p) => (
              <ItemRow
                key={p.id}
                titulo={
                  <>
                    {p.numeroLicao != null && <span className="tabular text-muted-foreground">{p.numeroLicao}. </span>}
                    {p.titulo}
                  </>
                }
                subtitulo={[p.classeNome, p.textoBiblico, p.dataSugerida && formatDataCurta(p.dataSugerida)].filter(Boolean).join(' · ')}
                onClick={() => abrir(p)}
              />
            ))}
          </GroupedList>
        </div>
      )}

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? 'Editar lição' : 'Nova lição'}
        onSubmit={() => {
          if (!form.classeId) return void toast.error('Selecione a classe');
          salvar.mutate();
        }}
        salvando={salvar.isPending}
        onExcluir={editando ? () => exclusao.pedir(editando) : undefined}
      >
        <Field label="Classe" htmlFor="l-classe">
          <NativeSelect id="l-classe" value={form.classeId} onChange={(e) => setForm({ ...form, classeId: e.target.value })} required>
            <option value="" disabled>
              Selecione
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <Field label="Nº" htmlFor="l-num">
            <Input
              id="l-num"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.numeroLicao}
              onChange={(e) => setForm({ ...form, numeroLicao: e.target.value })}
            />
          </Field>
          <Field label="Data sugerida" htmlFor="l-data">
            <Input id="l-data" type="date" value={form.dataSugerida} onChange={(e) => setForm({ ...form, dataSugerida: e.target.value })} />
          </Field>
        </div>
        <Field label="Título" htmlFor="l-titulo">
          <Input id="l-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required maxLength={200} />
        </Field>
        <Field label="Texto bíblico" htmlFor="l-texto">
          <Input
            id="l-texto"
            value={form.textoBiblico}
            placeholder="Romanos 12.1-8"
            onChange={(e) => setForm({ ...form, textoBiblico: e.target.value })}
            maxLength={200}
          />
        </Field>
      </FormDialog>

      {exclusao.dialog('Excluir lição?', <>A lição “{exclusao.alvo?.titulo}” será excluída.</>)}
    </div>
  );
}
