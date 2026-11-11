import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GroupedList } from '@/components/ui/card';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/tabs';
import { EmptyState, LoadingState } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';
import { classesApi, membrosApi } from '@/lib/services';
import type { Membro, MembroPayload, TipoMembro } from '@/lib/types';
import { normalizar } from '@/lib/utils';
import { Contagem, FormDialog, ItemRow, Toolbar, useExclusao } from './common';

const vazio = (classeId = ''): MembroPayload => ({ nome: '', classeId, tipoMembro: 'MEMBRO', telefone: '', ativo: true });

export default function MembrosTab() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [filtroClasse, setFiltroClasse] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'' | TipoMembro>('');
  const [editando, setEditando] = useState<Membro | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<MembroPayload>(vazio());

  const classesQ = useQuery({ queryKey: ['classes'], queryFn: classesApi.list });
  const membrosQ = useQuery({ queryKey: ['membros', { todos: true }], queryFn: () => membrosApi.list() });
  const classes = classesQ.data ?? [];

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (membrosQ.data ?? []).filter(
      (m) =>
        (!termo || normalizar(m.nome).includes(termo) || (m.telefone ?? '').includes(termo)) &&
        (!filtroClasse || m.classeId === filtroClasse) &&
        (!filtroTipo || m.tipoMembro === filtroTipo),
    );
  }, [membrosQ.data, busca, filtroClasse, filtroTipo]);

  const salvar = useMutation({
    mutationFn: () => {
      const payload = { ...form, nome: form.nome.trim(), telefone: form.telefone?.trim() || null };
      return editando ? membrosApi.update(editando.id, payload) : membrosApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membros'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      toast(editando ? 'Alterações salvas' : 'Cadastro criado');
      setAberto(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const exclusao = useExclusao<Membro>({
    remover: membrosApi.remove,
    invalidar: [['membros'], ['classes']],
    mensagem: 'Cadastro excluído',
    aoExcluir: () => setAberto(false),
  });

  function novo() {
    setEditando(null);
    setForm(vazio(filtroClasse || classes[0]?.id || ''));
    setAberto(true);
  }

  function editar(m: Membro) {
    setEditando(m);
    setForm({ nome: m.nome, classeId: m.classeId, tipoMembro: m.tipoMembro, telefone: m.telefone ?? '', ativo: m.ativo });
    setAberto(true);
  }

  return (
    <div className="grid gap-4">
      <Toolbar
        busca={busca}
        onBusca={setBusca}
        novoLabel="Novo"
        onNovo={novo}
        filtros={
          <>
            <NativeSelect value={filtroClasse} onChange={(e) => setFiltroClasse(e.target.value)} className="sm:w-48" aria-label="Classe">
              <option value="">Todas as classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as '' | TipoMembro)} className="sm:w-40" aria-label="Tipo">
              <option value="">Todos</option>
              <option value="MEMBRO">Membros</option>
              <option value="VISITANTE">Visitantes</option>
            </NativeSelect>
          </>
        }
      />

      {membrosQ.isLoading ? (
        <LoadingState />
      ) : !lista.length ? (
        <EmptyState
          title={membrosQ.data?.length ? 'Nenhum resultado' : 'Nenhum aluno cadastrado'}
          description={classes.length ? undefined : 'Cadastre uma classe antes de adicionar alunos.'}
        />
      ) : (
        <div>
          <Contagem n={lista.length} singular="pessoa" plural="pessoas" />
          <GroupedList>
            {lista.map((m) => (
              <ItemRow
                key={m.id}
                titulo={m.nome}
                subtitulo={[m.classeNome, m.telefone].filter(Boolean).join(' · ')}
                detalhe={!m.ativo ? 'Inativo' : m.tipoMembro === 'VISITANTE' ? 'Visitante' : undefined}
                onClick={() => editar(m)}
              />
            ))}
          </GroupedList>
        </div>
      )}

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? 'Editar cadastro' : 'Novo cadastro'}
        onSubmit={() => {
          if (!form.classeId) return void toast.error('Selecione a classe');
          salvar.mutate();
        }}
        salvando={salvar.isPending}
        onExcluir={editando ? () => exclusao.pedir(editando) : undefined}
      >
        <Segmented
          value={form.tipoMembro}
          onChange={(tipoMembro) => setForm({ ...form, tipoMembro })}
          options={[
            { value: 'MEMBRO', label: 'Membro' },
            { value: 'VISITANTE', label: 'Visitante' },
          ]}
        />
        <Field label="Nome completo" htmlFor="m-nome">
          <Input id="m-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required maxLength={150} />
        </Field>
        <Field label="Classe" htmlFor="m-classe">
          <NativeSelect id="m-classe" value={form.classeId} onChange={(e) => setForm({ ...form, classeId: e.target.value })} required>
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
        <Field label="Telefone / WhatsApp" htmlFor="m-tel">
          <Input
            id="m-tel"
            type="tel"
            inputMode="tel"
            value={form.telefone ?? ''}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
            maxLength={30}
          />
        </Field>
        {editando && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-ios-bg px-4 py-2.5">
            <div>
              <Label htmlFor="m-ativo" className="text-[15px] font-normal text-foreground">
                Ativo
              </Label>
              <p className="text-[12px] text-muted-foreground">Inativos não aparecem na chamada</p>
            </div>
            <Switch id="m-ativo" checked={form.ativo ?? true} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
          </div>
        )}
      </FormDialog>

      {exclusao.dialog(
        'Excluir cadastro?',
        <>
          {exclusao.alvo?.nome} será removido(a), junto com o histórico de presenças. Para apenas tirar da chamada, marque como inativo.
        </>,
      )}
    </div>
  );
}
