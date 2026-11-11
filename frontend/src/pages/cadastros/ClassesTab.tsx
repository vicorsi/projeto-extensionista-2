import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GroupedList } from '@/components/ui/card';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { EmptyState, LoadingState } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';
import { classesApi, usuariosApi } from '@/lib/services';
import type { Classe, ClassePayload } from '@/lib/types';
import { normalizar } from '@/lib/utils';
import { Contagem, FormDialog, ItemRow, Toolbar, useExclusao } from './common';

const vazio: ClassePayload = { nome: '', faixaEtaria: '', descricao: '', professorTitularId: '' };

export default function ClassesTab() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Classe | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<ClassePayload>(vazio);

  const classesQ = useQuery({ queryKey: ['classes'], queryFn: classesApi.list });
  const usuariosQ = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list });
  const professores = (usuariosQ.data ?? []).filter((u) => u.papel !== 'ALUNO');

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (classesQ.data ?? []).filter(
      (c) => !termo || normalizar(`${c.nome} ${c.faixaEtaria ?? ''} ${c.professorTitularNome ?? ''}`).includes(termo),
    );
  }, [classesQ.data, busca]);

  const salvar = useMutation({
    mutationFn: () => {
      const payload: ClassePayload = {
        nome: form.nome.trim(),
        faixaEtaria: form.faixaEtaria?.trim() || null,
        descricao: form.descricao?.trim() || null,
        professorTitularId: form.professorTitularId || null,
      };
      return editando ? classesApi.update(editando.id, payload) : classesApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['membros'] });
      qc.invalidateQueries({ queryKey: ['relatorio'] });
      toast(editando ? 'Alterações salvas' : 'Classe criada');
      setAberto(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const exclusao = useExclusao<Classe>({
    remover: classesApi.remove,
    invalidar: [['classes'], ['membros'], ['planos'], ['escalas'], ['relatorio']],
    mensagem: 'Classe excluída',
    aoExcluir: () => setAberto(false),
  });

  function abrir(c: Classe | null) {
    setEditando(c);
    setForm(
      c ? { nome: c.nome, faixaEtaria: c.faixaEtaria ?? '', descricao: c.descricao ?? '', professorTitularId: c.professorTitularId ?? '' } : vazio,
    );
    setAberto(true);
  }

  return (
    <div className="grid gap-4">
      <Toolbar busca={busca} onBusca={setBusca} novoLabel="Nova" onNovo={() => abrir(null)} />

      {classesQ.isLoading ? (
        <LoadingState />
      ) : !lista.length ? (
        <EmptyState
          title={classesQ.data?.length ? 'Nenhum resultado' : 'Nenhuma classe cadastrada'}
          description={classesQ.data?.length ? undefined : 'Por exemplo: Crianças, Jovens, Adultos.'}
        />
      ) : (
        <div>
          <Contagem n={lista.length} singular="classe" plural="classes" />
          <GroupedList>
            {lista.map((c) => (
              <ItemRow
                key={c.id}
                titulo={c.nome}
                subtitulo={[c.professorTitularNome ? `Titular: ${c.professorTitularNome}` : 'Sem titular', c.faixaEtaria].filter(Boolean).join(' · ')}
                detalhe={`${c.totalMembros}`}
                onClick={() => abrir(c)}
              />
            ))}
          </GroupedList>
        </div>
      )}

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? 'Editar classe' : 'Nova classe'}
        onSubmit={() => salvar.mutate()}
        salvando={salvar.isPending}
        onExcluir={editando ? () => exclusao.pedir(editando) : undefined}
      >
        <Field label="Nome" htmlFor="c-nome">
          <Input id="c-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required maxLength={100} />
        </Field>
        <Field label="Faixa etária" htmlFor="c-faixa">
          <Input
            id="c-faixa"
            value={form.faixaEtaria ?? ''}
            placeholder="18 a 30 anos"
            onChange={(e) => setForm({ ...form, faixaEtaria: e.target.value })}
            maxLength={60}
          />
        </Field>
        <Field label="Professor titular" htmlFor="c-prof">
          <NativeSelect id="c-prof" value={form.professorTitularId ?? ''} onChange={(e) => setForm({ ...form, professorTitularId: e.target.value })}>
            <option value="">Nenhum</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Descrição" htmlFor="c-desc">
          <Textarea id="c-desc" value={form.descricao ?? ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} maxLength={500} rows={3} />
        </Field>
      </FormDialog>

      {exclusao.dialog(
        'Excluir classe?',
        <>A classe {exclusao.alvo?.nome} será excluída junto com seus alunos, aulas, chamadas, escalas e lições. Esta ação não pode ser desfeita.</>,
      )}
    </div>
  );
}
