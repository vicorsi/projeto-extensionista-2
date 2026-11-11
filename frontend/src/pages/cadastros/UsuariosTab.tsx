import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { GroupedList } from '@/components/ui/card';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Segmented } from '@/components/ui/tabs';
import { EmptyState, LoadingState } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';
import { usuariosApi } from '@/lib/services';
import type { Papel, Usuario, UsuarioPayload } from '@/lib/types';
import { normalizar, papelLabel } from '@/lib/utils';
import { Contagem, FormDialog, ItemRow, Toolbar, useExclusao } from './common';

const vazio: UsuarioPayload = { nome: '', email: '', senha: '', papel: 'PROFESSOR' };

export default function UsuariosTab() {
  const { usuario: eu } = useAuth();
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [filtroPapel, setFiltroPapel] = useState<'' | Papel>('');
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<UsuarioPayload>(vazio);

  const usuariosQ = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list });

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (usuariosQ.data ?? []).filter(
      (u) => (!termo || normalizar(`${u.nome} ${u.email}`).includes(termo)) && (!filtroPapel || u.papel === filtroPapel),
    );
  }, [usuariosQ.data, busca, filtroPapel]);

  const salvar = useMutation({
    mutationFn: () => {
      const payload: UsuarioPayload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        papel: form.papel,
        senha: form.senha?.trim() ? form.senha : undefined,
      };
      return editando ? usuariosApi.update(editando.id, payload) : usuariosApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['escalas'] });
      toast(editando ? 'Alterações salvas' : 'Usuário criado');
      setAberto(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const exclusao = useExclusao<Usuario>({
    remover: usuariosApi.remove,
    invalidar: [['usuarios'], ['classes'], ['escalas']],
    mensagem: 'Usuário excluído',
    aoExcluir: () => setAberto(false),
  });

  function abrir(u: Usuario | null) {
    setEditando(u);
    setForm(u ? { nome: u.nome, email: u.email, senha: '', papel: u.papel } : vazio);
    setAberto(true);
  }

  function enviar() {
    const senha = form.senha ?? '';
    if (!editando && senha.length < 6) return void toast.error('A senha deve ter no mínimo 6 caracteres');
    if (editando && senha && senha.length < 6) return void toast.error('A nova senha deve ter no mínimo 6 caracteres');
    salvar.mutate();
  }

  return (
    <div className="grid gap-4">
      <Toolbar
        busca={busca}
        onBusca={setBusca}
        novoLabel="Novo"
        onNovo={() => abrir(null)}
        filtros={
          <NativeSelect value={filtroPapel} onChange={(e) => setFiltroPapel(e.target.value as '' | Papel)} className="col-span-2 sm:w-48" aria-label="Função">
            <option value="">Todas as funções</option>
            <option value="PROFESSOR">Professores</option>
            <option value="SUPERINTENDENTE">Superintendentes</option>
          </NativeSelect>
        }
      />

      {usuariosQ.isLoading ? (
        <LoadingState />
      ) : !lista.length ? (
        <EmptyState title="Nenhum usuário encontrado" />
      ) : (
        <div>
          <Contagem n={lista.length} singular="pessoa" plural="pessoas" />
          <GroupedList>
            {lista.map((u) => (
              <ItemRow
                key={u.id}
                titulo={
                  <>
                    {u.nome}
                    {u.id === eu?.id && <span className="text-muted-foreground"> (você)</span>}
                  </>
                }
                subtitulo={u.email}
                detalhe={papelLabel[u.papel]}
                onClick={() => abrir(u)}
              />
            ))}
          </GroupedList>
        </div>
      )}

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? 'Editar usuário' : 'Novo usuário'}
        onSubmit={enviar}
        salvando={salvar.isPending}
        onExcluir={editando && editando.id !== eu?.id ? () => exclusao.pedir(editando) : undefined}
      >
        <Segmented
          value={form.papel}
          onChange={(papel) => setForm({ ...form, papel })}
          options={[
            { value: 'PROFESSOR', label: 'Professor' },
            { value: 'SUPERINTENDENTE', label: 'Superintendente' },
          ]}
        />
        <Field label="Nome completo" htmlFor="u-nome">
          <Input id="u-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required maxLength={150} />
        </Field>
        <Field label="E-mail" htmlFor="u-email">
          <Input
            id="u-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            maxLength={180}
          />
        </Field>
        <Field
          label={editando ? 'Nova senha' : 'Senha'}
          htmlFor="u-senha"
          hint={editando ? 'Deixe em branco para manter a atual' : 'Mínimo de 6 caracteres'}
        >
          <Input
            id="u-senha"
            type="password"
            autoComplete="new-password"
            value={form.senha ?? ''}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            required={!editando}
            maxLength={100}
          />
        </Field>
      </FormDialog>

      {exclusao.dialog(
        'Excluir usuário?',
        <>{exclusao.alvo?.nome} perderá o acesso e será removido(a) das escalas. As classes em que é titular ficarão sem titular.</>,
      )}
    </div>
  );
}
