import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, GroupedList, SectionLabel } from '@/components/ui/card';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmDialog, EmptyState, LoadingState, Metrics, PageHeader, WhatsAppDialog } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';
import { aulasApi, chamadasApi, classesApi, escalasApi, membrosApi } from '@/lib/services';
import type { AulaUpdatePayload, Escala, Membro } from '@/lib/types';
import {
  cn,
  formatDataLonga,
  formatMoeda,
  isDomingo,
  lerPreferencia,
  normalizar,
  numeroParaCampo,
  papelEscalaLabel,
  parseMoeda,
  proximoDomingo,
  salvarPreferencia,
  statusAulaLabel,
} from '@/lib/utils';
import { HistoricoDialog, LicoesRevistaDialog, NovoAlunoDialog } from './chamada/ChamadaDialogs';
import {
  useChamadaOtimista,
  VAZIO,
  type CampoChamada,
  type EstadoChamada,
  type StatusSalvamento,
} from './chamada/useChamadaOtimista';

type Filtro = 'todos' | 'membros' | 'visitantes' | 'presentes' | 'ausentes';
type Modal = null | 'licoes' | 'historico' | 'novo' | 'whatsapp' | 'resetar';

const PREF_CLASSE = 'ebd.chamada.classeId';

// ---------------------------------------------------------------------------
// Linha do aluno com 3 botões táteis
// ---------------------------------------------------------------------------

const botoes: { campo: CampoChamada; label: string; ativo: string }[] = [
  { campo: 'presente', label: 'Presente', ativo: 'bg-ios-green text-white' },
  { campo: 'trouxeBiblia', label: 'Bíblia', ativo: 'bg-ios-blue text-white' },
  { campo: 'trouxeRevista', label: 'Revista', ativo: 'bg-ios-orange text-white' },
];

const AlunoLinha = memo(function AlunoLinha({
  membro,
  estado,
  status,
  onToggle,
}: {
  membro: Membro;
  estado: EstadoChamada;
  status?: StatusSalvamento;
  onToggle: (membroId: string, campo: CampoChamada) => void;
}) {
  return (
    <li className="px-4 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[16px]">
          {membro.nome}
          {membro.tipoMembro === 'VISITANTE' && <span className="ml-2 text-[13px] text-ios-purple">Visitante</span>}
        </p>
        <StatusTexto status={status} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {botoes.map(({ campo, label, ativo }) => {
          const on = estado[campo];
          return (
            <button
              key={campo}
              type="button"
              onClick={() => onToggle(membro.id, campo)}
              aria-pressed={on}
              className={cn(
                'h-11 select-none rounded-full text-[14px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97]',
                on ? ativo : 'bg-ios-bg text-muted-foreground hover:bg-ios-fill',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </li>
  );
});

function StatusTexto({ status }: { status?: StatusSalvamento }) {
  if (status === 'saving')
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground">
        <Spinner className="h-3 w-3" /> Salvando
      </span>
    );
  if (status === 'saved') return <span className="shrink-0 text-[12px] text-ios-green-text">Salvo</span>;
  if (status === 'error') return <span className="shrink-0 text-[12px] text-ios-red">Não salvo</span>;
  return null;
}

// ---------------------------------------------------------------------------
// Estatísticas e texto para WhatsApp
// ---------------------------------------------------------------------------

function calcularStats(membros: Membro[], registros: Record<string, EstadoChamada>) {
  let matriculados = 0;
  let membrosPresentes = 0;
  let presentes = 0;
  let visitantes = 0;
  let biblias = 0;
  let revistas = 0;
  for (const m of membros) {
    const r = registros[m.id] ?? VAZIO;
    if (m.tipoMembro === 'MEMBRO') matriculados++;
    if (r.presente) {
      presentes++;
      if (m.tipoMembro === 'MEMBRO') membrosPresentes++;
      else visitantes++;
    }
    if (r.trouxeBiblia) biblias++;
    if (r.trouxeRevista) revistas++;
  }
  const frequencia = matriculados ? Math.round((membrosPresentes * 100) / matriculados) : 0;
  return { matriculados, membrosPresentes, presentes, ausentes: Math.max(0, matriculados - membrosPresentes), visitantes, biblias, revistas, frequencia };
}

function montarResumo(p: {
  classeNome: string;
  dataAula: string;
  escala?: Escala;
  form: { numeroLicao: string; temaLicao: string; leituraBiblica: string };
  oferta: number | null | undefined;
  stats: ReturnType<typeof calcularStats>;
  visitantes: string[];
}) {
  const { stats } = p;
  const linhas = [`*EBD — Classe ${p.classeNome}*`, formatDataLonga(p.dataAula)];
  if (p.escala) linhas.push(`Professor(a): ${p.escala.professorNome} (${papelEscalaLabel[p.escala.papelEscala]})`);
  if (p.form.temaLicao || p.form.numeroLicao) {
    linhas.push(`${p.form.numeroLicao ? `Lição ${p.form.numeroLicao}` : 'Lição'}${p.form.temaLicao ? `: ${p.form.temaLicao}` : ''}`);
  }
  if (p.form.leituraBiblica) linhas.push(`Leitura: ${p.form.leituraBiblica}`);
  linhas.push(
    '',
    `Presentes: ${stats.presentes} (${stats.membrosPresentes} de ${stats.matriculados} matriculados, ${stats.frequencia}%)`,
    `Ausentes: ${stats.ausentes}`,
    `Bíblias: ${stats.biblias}`,
    `Revistas: ${stats.revistas}`,
    `Visitantes: ${stats.visitantes}`,
    `Oferta: ${formatMoeda(p.oferta ?? 0)}`,
  );
  if (p.visitantes.length) linhas.push('', '*Visitantes*', ...p.visitantes.map((n) => `– ${n}`));
  return linhas.join('\n');
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function TeacherDashboard() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const isSuper = usuario?.papel === 'SUPERINTENDENTE';

  const [classeId, setClasseId] = useState<string>(() => lerPreferencia(PREF_CLASSE) ?? '');
  const [dataAula, setDataAula] = useState(() => proximoDomingo());
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [modal, setModal] = useState<Modal>(null);

  // ----- Dados -----
  const classesQ = useQuery({ queryKey: ['classes'], queryFn: classesApi.list });
  const classes = useMemo(() => classesQ.data ?? [], [classesQ.data]);
  const classe = classes.find((c) => c.id === classeId);

  useEffect(() => {
    if (!classes.length) return;
    if (classeId && classes.some((c) => c.id === classeId)) return;
    const padrao = classes.find((c) => c.professorTitularId === usuario?.id) ?? classes[0];
    setClasseId(padrao.id);
  }, [classes, classeId, usuario?.id]);

  useEffect(() => {
    if (classeId) salvarPreferencia(PREF_CLASSE, classeId);
  }, [classeId]);

  const aulaQ = useQuery({
    queryKey: ['aula', classeId, dataAula],
    queryFn: () => aulasApi.obterOuCriar(classeId, dataAula),
    enabled: !!classe && !!dataAula,
    staleTime: 60_000,
  });
  const aula = aulaQ.data;

  const membrosQ = useQuery({
    queryKey: ['membros', { classeId }],
    queryFn: () => membrosApi.list({ classeId }),
    enabled: !!classe,
  });
  const membros = useMemo(() => (membrosQ.data ?? []).filter((m) => m.ativo), [membrosQ.data]);

  const escalasQ = useQuery({ queryKey: ['escalas', dataAula], queryFn: () => escalasApi.list(dataAula) });
  const escala = escalasQ.data?.find((e) => e.classeId === classeId);

  const chamadasQ = useQuery({
    queryKey: ['chamadas', aula?.id],
    queryFn: () => chamadasApi.list(aula!.id),
    enabled: !!aula,
    staleTime: 0,
    gcTime: 0,
    refetchOnReconnect: false,
  });

  const { registros, status, alternar, definir, substituirTodos, salvando } = useChamadaOtimista(aula?.id, chamadasQ.data);

  // ----- Formulário da lição / oferta -----
  const [form, setForm] = useState({ numeroLicao: '', temaLicao: '', leituraBiblica: '' });
  const [oferta, setOferta] = useState('');

  useEffect(() => {
    if (!aula) return;
    setForm({
      numeroLicao: aula.numeroLicao?.toString() ?? '',
      temaLicao: aula.temaLicao ?? '',
      leituraBiblica: aula.leituraBiblica ?? '',
    });
    setOferta(numeroParaCampo(aula.valorOferta));
  }, [aula]);

  const formAlterado =
    !!aula &&
    (form.numeroLicao !== (aula.numeroLicao?.toString() ?? '') ||
      form.temaLicao !== (aula.temaLicao ?? '') ||
      form.leituraBiblica !== (aula.leituraBiblica ?? ''));
  const ofertaAlterada = !!aula && oferta !== numeroParaCampo(aula.valorOferta);

  const salvarAula = useMutation({
    mutationFn: ({ patch }: { patch?: Partial<AulaUpdatePayload>; mensagem?: string }) => {
      const valorOferta = parseMoeda(oferta);
      const numero = form.numeroLicao.trim() ? Number(form.numeroLicao) : null;
      const payload: AulaUpdatePayload = {
        numeroLicao: numero && Number.isFinite(numero) && numero > 0 ? Math.trunc(numero) : null,
        temaLicao: form.temaLicao.trim() || null,
        leituraBiblica: form.leituraBiblica.trim() || null,
        valorOferta: valorOferta === undefined ? (aula!.valorOferta ?? null) : valorOferta,
        status: aula!.status,
        ...patch,
      };
      return aulasApi.update(aula!.id, payload);
    },
    onSuccess: (a, vars) => {
      qc.setQueryData(['aula', a.classeId, a.dataAula], a);
      qc.invalidateQueries({ queryKey: ['historico', a.classeId] });
      qc.invalidateQueries({ queryKey: ['relatorio'] });
      toast(vars.mensagem ?? 'Salvo');
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Não foi possível salvar a aula')),
  });

  function salvarOferta() {
    if (parseMoeda(oferta) === undefined) {
      toast.error('Valor inválido. Use o formato 25,50');
      return;
    }
    salvarAula.mutate({ mensagem: 'Oferta salva' });
  }

  // ----- Ações em lote -----
  const marcarTodos = useMutation({
    mutationFn: () => chamadasApi.marcarTodos(aula!.id),
    onSuccess: (lista) => {
      substituirTodos(lista);
      toast('Todos marcados como presentes');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const resetar = useMutation({
    mutationFn: () => chamadasApi.resetar(aula!.id),
    onSuccess: (lista) => {
      substituirTodos(lista);
      setModal(null);
      toast('Chamada reiniciada');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ----- Derivados -----
  const stats = useMemo(() => calcularStats(membros, registros), [membros, registros]);

  const contagens = useMemo(() => {
    const presentes = membros.filter((m) => registros[m.id]?.presente).length;
    const visitantes = membros.filter((m) => m.tipoMembro === 'VISITANTE').length;
    return {
      todos: membros.length,
      membros: membros.length - visitantes,
      visitantes,
      presentes,
      ausentes: membros.length - presentes,
    } satisfies Record<Filtro, number>;
  }, [membros, registros]);

  const listaFiltrada = useMemo(() => {
    const termo = normalizar(busca.trim());
    return membros.filter((m) => {
      if (termo && !normalizar(m.nome).includes(termo)) return false;
      const presente = !!registros[m.id]?.presente;
      switch (filtro) {
        case 'membros':
          return m.tipoMembro === 'MEMBRO';
        case 'visitantes':
          return m.tipoMembro === 'VISITANTE';
        case 'presentes':
          return presente;
        case 'ausentes':
          return !presente;
        default:
          return true;
      }
    });
  }, [membros, registros, busca, filtro]);

  const textoWhatsApp = useMemo(
    () =>
      classe
        ? montarResumo({
            classeNome: classe.nome,
            dataAula,
            escala,
            form,
            oferta: parseMoeda(oferta) ?? aula?.valorOferta,
            stats,
            visitantes: membros.filter((m) => m.tipoMembro === 'VISITANTE' && registros[m.id]?.presente).map((m) => m.nome),
          })
        : '',
    [classe, dataAula, escala, aula, form, oferta, stats, membros, registros],
  );

  // ----- Estados vazios -----
  if (classesQ.isLoading) return <LoadingState />;
  if (classesQ.isError) return <EmptyState title="Não foi possível carregar as classes" description={getErrorMessage(classesQ.error)} />;
  if (!classes.length)
    return (
      <div className="grid gap-6">
        <PageHeader title="Chamada" />
        <EmptyState
          title="Nenhuma classe cadastrada"
          description={
            isSuper ? 'Cadastre as classes da EBD para começar a fazer a chamada.' : 'Peça à superintendência para cadastrar as classes.'
          }
          action={
            isSuper && (
              <Button asChild>
                <Link to="/cadastros">Ir para Cadastros</Link>
              </Button>
            )
          }
        />
      </div>
    );

  const filtros: { valor: Filtro; label: string }[] = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'membros', label: 'Membros' },
    { valor: 'visitantes', label: 'Visitantes' },
    { valor: 'presentes', label: 'Presentes' },
    { valor: 'ausentes', label: 'Ausentes' },
  ];

  const carregandoAula = aulaQ.isLoading || (!!aula && chamadasQ.isLoading);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <PageHeader
          eyebrow={`${formatDataLonga(dataAula)}${isDomingo(dataAula) ? '' : ' · não é domingo'}`}
          title={classe?.nome ?? 'Chamada'}
          actions={
            <Button variant="plain" size="sm" onClick={() => setModal('historico')}>
              Histórico
            </Button>
          }
        />

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <NativeSelect value={classeId} onChange={(e) => setClasseId(e.target.value)} aria-label="Classe">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.faixaEtaria ? ` · ${c.faixaEtaria}` : ''}
              </option>
            ))}
          </NativeSelect>
          <Input
            type="date"
            value={dataAula}
            onChange={(e) => e.target.value && setDataAula(e.target.value)}
            className="w-[150px] sm:w-44"
            aria-label="Data da aula"
          />
        </div>

        <p className="px-1 text-[14px] text-muted-foreground">
          {escala ? (
            <>
              Professor escalado: <span className="text-foreground">{escala.professorNome}</span> · {papelEscalaLabel[escala.papelEscala]}
              {escala.observacao && <span className="block text-[13px]">{escala.observacao}</span>}
            </>
          ) : (
            <>
              Nenhum professor escalado
              {classe?.professorTitularNome ? ` · Titular: ${classe.professorTitularNome}` : ''}
            </>
          )}
        </p>
      </div>

      {carregandoAula || !aula ? (
        aulaQ.isError ? (
          <EmptyState title="Não foi possível abrir a aula" description={getErrorMessage(aulaQ.error)} />
        ) : (
          <LoadingState label="Abrindo a aula" />
        )
      ) : (
        <>
          {/* Lição */}
          <section>
            <SectionLabel
              action={
                <span className={cn('text-[13px]', aula.status === 'CONCLUIDA' ? 'text-ios-green-text' : 'text-muted-foreground')}>
                  {statusAulaLabel(aula.status)}
                </span>
              }
            >
              Lição do dia
            </SectionLabel>
            <Card>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-[4.5rem_1fr] gap-3">
                  <Field label="Nº" htmlFor="licao-num">
                    <Input
                      id="licao-num"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={form.numeroLicao}
                      onChange={(e) => setForm({ ...form, numeroLicao: e.target.value })}
                    />
                  </Field>
                  <Field label="Tema" htmlFor="licao-tema">
                    <Input id="licao-tema" value={form.temaLicao} maxLength={200} onChange={(e) => setForm({ ...form, temaLicao: e.target.value })} />
                  </Field>
                </div>
                <Field label="Texto bíblico" htmlFor="licao-texto">
                  <Input
                    id="licao-texto"
                    value={form.leituraBiblica}
                    maxLength={200}
                    placeholder="João 3.16-21"
                    onChange={(e) => setForm({ ...form, leituraBiblica: e.target.value })}
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setModal('licoes')}>
                    Lições da revista
                  </Button>
                  <Button
                    variant="plain"
                    size="sm"
                    onClick={() =>
                      salvarAula.mutate({
                        patch: { status: aula.status === 'CONCLUIDA' ? 'ABERTA' : 'CONCLUIDA' },
                        mensagem: aula.status === 'CONCLUIDA' ? 'Aula reaberta' : 'Aula concluída',
                      })
                    }
                    disabled={salvarAula.isPending}
                  >
                    {aula.status === 'CONCLUIDA' ? 'Reabrir aula' : 'Concluir aula'}
                  </Button>
                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => salvarAula.mutate({ mensagem: 'Lição salva' })}
                    loading={salvarAula.isPending && formAlterado}
                    disabled={!formAlterado}
                  >
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Resumo */}
          <section>
            <SectionLabel>Resumo</SectionLabel>
            <Metrics
              items={[
                {
                  label: 'Presentes',
                  value: (
                    <>
                      {stats.membrosPresentes}
                      <span className="text-[17px] font-normal text-muted-foreground"> / {stats.matriculados}</span>
                    </>
                  ),
                  hint: `${stats.frequencia}% · ${stats.ausentes} ausente${stats.ausentes === 1 ? '' : 's'}`,
                },
                { label: 'Bíblias', value: stats.biblias, hint: `de ${stats.presentes} presentes` },
                { label: 'Revistas', value: stats.revistas, hint: `de ${stats.presentes} presentes` },
                { label: 'Visitantes', value: stats.visitantes, hint: 'presentes hoje' },
              ]}
            />
          </section>

          {/* Chamada */}
          <section className="grid gap-3">
            <SectionLabel
              className="mb-0"
              action={
                salvando ? (
                  <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Spinner className="h-3 w-3" /> Salvando
                  </span>
                ) : undefined
              }
            >
              Chamada
            </SectionLabel>

            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <Button variant="secondary" size="sm" onClick={() => marcarTodos.mutate()} loading={marcarTodos.isPending} disabled={!membros.length}>
                Marcar todos
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal('resetar')} disabled={!stats.presentes}>
                Resetar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal('novo')}>
                Adicionar pessoa
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal('whatsapp')}>
                Enviar no WhatsApp
              </Button>
            </div>

            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" type="search" className="h-10 border-0 bg-ios-fill" aria-label="Buscar aluno" />

            <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {filtros.map(({ valor, label }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  className={cn(
                    'h-8 shrink-0 rounded-full px-3.5 text-[13px] transition-colors',
                    filtro === valor ? 'bg-foreground font-medium text-white' : 'text-muted-foreground hover:bg-black/[0.05]',
                  )}
                >
                  {label} <span className="tabular opacity-60">{contagens[valor]}</span>
                </button>
              ))}
            </div>

            {membrosQ.isLoading ? (
              <LoadingState label="Carregando alunos" />
            ) : !membros.length ? (
              <EmptyState
                title="Nenhum aluno nesta classe"
                description="Adicione alunos ou visitantes para fazer a chamada."
                action={<Button onClick={() => setModal('novo')}>Adicionar aluno</Button>}
              />
            ) : !listaFiltrada.length ? (
              <p className="py-10 text-center text-[15px] text-muted-foreground">Nenhum resultado.</p>
            ) : (
              <GroupedList>
                {listaFiltrada.map((m) => (
                  <AlunoLinha key={m.id} membro={m} estado={registros[m.id] ?? VAZIO} status={status[m.id]} onToggle={alternar} />
                ))}
              </GroupedList>
            )}
          </section>

          {/* Oferta */}
          <section>
            <SectionLabel>Oferta da classe</SectionLabel>
            <Card>
              <CardContent className="flex items-center gap-3">
                <span className="text-[17px] text-muted-foreground">R$</span>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={oferta}
                  onChange={(e) => setOferta(e.target.value.replace(/[^\d.,]/g, ''))}
                  className="tabular min-w-0 flex-1 bg-transparent text-[28px] font-semibold tracking-tight placeholder:text-muted-foreground/40 focus:outline-none"
                  aria-label="Valor da oferta"
                />
                <Button size="sm" onClick={salvarOferta} disabled={!ofertaAlterada} loading={salvarAula.isPending && ofertaAlterada}>
                  Salvar
                </Button>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* Modais */}
      {classe && (
        <>
          <LicoesRevistaDialog
            open={modal === 'licoes'}
            onOpenChange={(o) => setModal(o ? 'licoes' : null)}
            classeId={classe.id}
            classeNome={classe.nome}
            onSelecionar={(p) => {
              setForm({ numeroLicao: p.numeroLicao?.toString() ?? '', temaLicao: p.titulo, leituraBiblica: p.textoBiblico ?? '' });
              salvarAula.mutate({
                patch: { numeroLicao: p.numeroLicao, temaLicao: p.titulo, leituraBiblica: p.textoBiblico },
                mensagem: 'Lição aplicada',
              });
              setModal(null);
            }}
          />
          <HistoricoDialog
            open={modal === 'historico'}
            onOpenChange={(o) => setModal(o ? 'historico' : null)}
            classeId={classe.id}
            classeNome={classe.nome}
            dataAtual={dataAula}
            onSelecionar={(a) => {
              setDataAula(a.dataAula);
              setModal(null);
            }}
          />
          <NovoAlunoDialog
            open={modal === 'novo'}
            onOpenChange={(o) => setModal(o ? 'novo' : null)}
            classeId={classe.id}
            classeNome={classe.nome}
            onCriado={(m, presente) => {
              if (presente && aula) definir(m.id, { presente: true, trouxeBiblia: false, trouxeRevista: false });
            }}
          />
          <WhatsAppDialog
            open={modal === 'whatsapp'}
            onOpenChange={(o) => setModal(o ? 'whatsapp' : null)}
            title="Resumo da aula"
            subtitle={classe.nome}
            texto={textoWhatsApp}
          />
          <ConfirmDialog
            open={modal === 'resetar'}
            onOpenChange={(o) => setModal(o ? 'resetar' : null)}
            title="Resetar a chamada?"
            description="Todas as marcações de presença, Bíblia e Revista desta aula serão apagadas."
            confirmLabel="Resetar"
            destructive
            loading={resetar.isPending}
            onConfirm={() => resetar.mutate()}
          />
        </>
      )}
    </div>
  );
}
