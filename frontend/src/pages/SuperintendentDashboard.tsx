import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GroupedList, SectionLabel } from '@/components/ui/card';
import { Input, NativeSelect } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DomingoNavigator, EmptyState, LoadingState, Metrics, PageHeader, WhatsAppDialog } from '@/components/shared';
import { getErrorMessage } from '@/lib/api';
import { classesApi, escalasApi, relatoriosApi, usuariosApi } from '@/lib/services';
import type { Classe, Escala, PapelEscala, RelatorioConsolidado, Usuario } from '@/lib/types';
import {
  cn,
  formatDataLonga,
  formatMoeda,
  lerPreferencia,
  papelEscalaLabel,
  proximoDomingo,
  salvarPreferencia,
  statusAulaLabel,
} from '@/lib/utils';

const PREF_ABA = 'ebd.super.aba';

export default function SuperintendentDashboard() {
  const [data, setData] = useState(() => proximoDomingo());
  const [aba, setAba] = useState(() => lerPreferencia(PREF_ABA) ?? 'escala');

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Superintendência" title="Painel" />
      <DomingoNavigator value={data} onChange={setData} />
      <Tabs
        value={aba}
        onValueChange={(v) => {
          setAba(v);
          salvarPreferencia(PREF_ABA, v);
        }}
      >
        <TabsList>
          <TabsTrigger value="escala">Escala</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>
        <TabsContent value="escala">
          <EscalaTab data={data} />
        </TabsContent>
        <TabsContent value="relatorio">
          <RelatorioTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escala de professores
// ---------------------------------------------------------------------------

function EscalaTab({ data }: { data: string }) {
  const qc = useQueryClient();
  const [whats, setWhats] = useState(false);

  const classesQ = useQuery({ queryKey: ['classes'], queryFn: classesApi.list });
  const usuariosQ = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list });
  const escalasQ = useQuery({ queryKey: ['escalas', data], queryFn: () => escalasApi.list(data) });

  const classes = useMemo(() => classesQ.data ?? [], [classesQ.data]);
  const professores = useMemo(() => (usuariosQ.data ?? []).filter((u) => u.papel !== 'ALUNO'), [usuariosQ.data]);
  const porClasse = useMemo(() => {
    const m = new Map<string, Escala>();
    for (const e of escalasQ.data ?? []) m.set(e.classeId, e);
    return m;
  }, [escalasQ.data]);

  const escaladas = classes.filter((c) => porClasse.has(c.id)).length;
  const pendentesComTitular = classes.filter((c) => !porClasse.has(c.id) && c.professorTitularId).length;

  const replicar = useMutation({
    mutationFn: () => escalasApi.replicarTitulares(data),
    onSuccess: (lista) => {
      qc.setQueryData(['escalas', data], lista);
      qc.invalidateQueries({ queryKey: ['relatorio', data] });
      toast('Titulares replicados');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const texto = useMemo(() => {
    const linhas = ['*Escala de Professores — EBD*', formatDataLonga(data), ''];
    for (const c of classes) {
      const e = porClasse.get(c.id);
      linhas.push(e ? `*${c.nome}*: ${e.professorNome} (${papelEscalaLabel[e.papelEscala]})` : `*${c.nome}*: sem professor escalado`);
      if (e?.observacao) linhas.push(`   ${e.observacao}`);
    }
    return linhas.join('\n');
  }, [classes, porClasse, data]);

  if (classesQ.isLoading || usuariosQ.isLoading || escalasQ.isLoading) return <LoadingState />;
  if (classesQ.isError || usuariosQ.isError || escalasQ.isError) return <EmptyState title="Não foi possível carregar a escala" />;
  if (!classes.length)
    return (
      <EmptyState
        title="Nenhuma classe cadastrada"
        description="Cadastre as classes e os professores para montar a escala."
        action={
          <Button asChild>
            <Link to="/cadastros">Ir para Cadastros</Link>
          </Button>
        }
      />
    );

  const progresso = Math.round((escaladas / classes.length) * 100);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 px-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px]">
            <span className="font-semibold">{escaladas}</span>
            <span className="text-muted-foreground"> de {classes.length} classes com professor escalado</span>
          </p>
          <span className="tabular text-[13px] text-muted-foreground">{progresso}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-ios-fill">
          <div className={cn('h-full rounded-full transition-all duration-500', progresso === 100 ? 'bg-ios-green' : 'bg-primary')} style={{ width: `${progresso}%` }} />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={() => replicar.mutate()} loading={replicar.isPending} disabled={!pendentesComTitular}>
            Replicar titulares
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWhats(true)}>
            Enviar no WhatsApp
          </Button>
        </div>
      </div>

      <GroupedList>
        {classes.map((c) => (
          <EscalaLinha key={c.id} classe={c} escala={porClasse.get(c.id)} professores={professores} data={data} />
        ))}
      </GroupedList>

      <WhatsAppDialog open={whats} onOpenChange={setWhats} title="Escala de professores" subtitle={formatDataLonga(data)} texto={texto} />
    </div>
  );
}

function EscalaLinha({ classe, escala, professores, data }: { classe: Classe; escala?: Escala; professores: Usuario[]; data: string }) {
  const qc = useQueryClient();
  const [obs, setObs] = useState(escala?.observacao ?? '');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    setObs(escala?.observacao ?? '');
  }, [escala?.id, escala?.observacao, data]);

  const salvar = useMutation({
    mutationFn: (v: { professorId: string | null; papelEscala: PapelEscala; observacao: string }) =>
      escalasApi.upsert({ classeId: classe.id, dataDomingo: data, ...v, observacao: v.observacao.trim() || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalas', data] });
      qc.invalidateQueries({ queryKey: ['relatorio', data] });
      setSalvo(true);
      window.setTimeout(() => setSalvo(false), 1500);
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Não foi possível salvar a escala')),
  });

  const papel: PapelEscala = escala?.papelEscala ?? 'TITULAR';

  function trocarProfessor(professorId: string) {
    if (!professorId) {
      salvar.mutate({ professorId: null, papelEscala: papel, observacao: '' });
      return;
    }
    const sugerido: PapelEscala = escala ? escala.papelEscala : professorId === classe.professorTitularId ? 'TITULAR' : 'SUBSTITUTO';
    salvar.mutate({ professorId, papelEscala: sugerido, observacao: obs });
  }

  return (
    <li className="grid gap-3 px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold tracking-tight">{classe.nome}</p>
          <p className="truncate text-[13px] text-muted-foreground">Titular: {classe.professorTitularNome ?? 'não definido'}</p>
        </div>
        <span className="shrink-0 text-[13px]">
          {salvar.isPending ? (
            <Spinner className="h-3.5 w-3.5 text-muted-foreground" />
          ) : salvo ? (
            <span className="text-ios-green-text">Salvo</span>
          ) : escala ? (
            <span className="text-ios-green-text">Escalado</span>
          ) : (
            <span className="text-ios-orange-text">Pendente</span>
          )}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_9rem_1fr]">
        <NativeSelect value={escala?.professorId ?? ''} onChange={(e) => trocarProfessor(e.target.value)} disabled={salvar.isPending} aria-label="Professor escalado">
          <option value="">Não escalado</option>
          {professores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
              {p.id === classe.professorTitularId ? ' (titular)' : ''}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={papel}
          disabled={!escala || salvar.isPending}
          aria-label="Papel na escala"
          onChange={(e) => escala && salvar.mutate({ professorId: escala.professorId, papelEscala: e.target.value as PapelEscala, observacao: obs })}
        >
          {(Object.keys(papelEscalaLabel) as PapelEscala[]).map((p) => (
            <option key={p} value={p}>
              {papelEscalaLabel[p]}
            </option>
          ))}
        </NativeSelect>
        <Input
          value={obs}
          maxLength={300}
          disabled={!escala}
          placeholder="Observação"
          aria-label="Observação"
          onChange={(e) => setObs(e.target.value)}
          onBlur={() => {
            if (escala && obs.trim() !== (escala.observacao ?? '')) {
              salvar.mutate({ professorId: escala.professorId, papelEscala: escala.papelEscala, observacao: obs });
            }
          }}
        />
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Relatório consolidado
// ---------------------------------------------------------------------------

function textoRelatorio(r: RelatorioConsolidado) {
  const pct = (n: number) => n.toLocaleString('pt-BR');
  const linhas = [
    '*Relatório Geral da EBD*',
    formatDataLonga(r.dataDomingo),
    '',
    `Presentes: ${r.presentes}`,
    `Matriculados: ${r.matriculados} (frequência de ${pct(r.frequencia)}%)`,
    `Ausentes: ${r.ausentes}`,
    `Bíblias: ${r.biblias}`,
    `Revistas: ${r.revistas}`,
    `Visitantes: ${r.visitantes}`,
    `Ofertas: ${formatMoeda(r.totalOfertas)}`,
    `Aulas concluídas: ${r.aulasConcluidas} de ${r.totalClasses}`,
    '',
    '*Por classe*',
  ];
  for (const c of r.classes) {
    if (!c.aulaId) {
      linhas.push(`${c.classeNome}: sem chamada registrada`);
      continue;
    }
    linhas.push(`${c.classeNome}: ${c.presentes} presentes, ${pct(c.frequencia)}%, ${formatMoeda(c.oferta)}`);
    if (c.temaLicao) linhas.push(`   ${c.numeroLicao ? `Lição ${c.numeroLicao}: ` : ''}${c.temaLicao}`);
  }
  return linhas.join('\n');
}

function RelatorioTab({ data }: { data: string }) {
  const [whats, setWhats] = useState(false);
  const { data: r, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['relatorio', data],
    queryFn: () => relatoriosApi.consolidado(data),
    staleTime: 0,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !r) return <EmptyState title="Não foi possível carregar o relatório" description={getErrorMessage(error)} />;
  if (!r.totalClasses) return <EmptyState title="Nenhuma classe cadastrada" />;

  return (
    <div className="grid gap-6">
      <Metrics
        items={[
          { label: 'Presentes', value: r.presentes, hint: `${r.frequencia.toLocaleString('pt-BR')}% de ${r.matriculados} matriculados` },
          { label: 'Ofertas', value: formatMoeda(r.totalOfertas), hint: `${r.aulasIniciadas} classes com chamada` },
          {
            label: 'Bíblias / Revistas',
            value: (
              <>
                {r.biblias}
                <span className="text-[17px] font-normal text-muted-foreground"> / {r.revistas}</span>
              </>
            ),
          },
          { label: 'Visitantes', value: r.visitantes, hint: 'em todas as classes' },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="flex items-center gap-2 text-[15px]">
          <span className="font-semibold">{r.aulasConcluidas}</span>
          <span className="text-muted-foreground">de {r.totalClasses} aulas concluídas</span>
          {isFetching && <Spinner className="h-3 w-3 text-muted-foreground" />}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setWhats(true)}>
          Copiar para WhatsApp
        </Button>
      </div>

      <section>
        <SectionLabel>Por classe</SectionLabel>
        <GroupedList>
          {r.classes.map((c) => (
            <li key={c.classeId} className="px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-[16px] font-medium">{c.classeNome}</p>
                <span
                  className={cn(
                    'shrink-0 text-[13px]',
                    c.status === 'CONCLUIDA' ? 'text-ios-green-text' : c.status === 'ABERTA' ? 'text-ios-orange-text' : 'text-muted-foreground',
                  )}
                >
                  {statusAulaLabel(c.status)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {c.temaLicao ? `${c.numeroLicao ? `Lição ${c.numeroLicao} · ` : ''}${c.temaLicao}` : 'Tema não informado'}
                {c.professorEscalado ? ` · ${c.professorEscalado}` : ''}
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-ios-fill">
                  <div className="h-full rounded-full bg-ios-green" style={{ width: `${Math.min(100, c.frequencia)}%` }} />
                </div>
                <span className="tabular w-12 shrink-0 text-right text-[13px] text-muted-foreground">{c.frequencia.toLocaleString('pt-BR')}%</span>
              </div>
              <div className="tabular mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-muted-foreground">
                <span>{c.presentes} presentes</span>
                <span>{c.biblias} bíblias</span>
                <span>{c.revistas} revistas</span>
                <span>{c.visitantes} visitantes</span>
                <span className="ml-auto font-medium text-foreground">{formatMoeda(c.oferta)}</span>
              </div>
            </li>
          ))}
        </GroupedList>
      </section>

      <WhatsAppDialog open={whats} onOpenChange={setWhats} title="Relatório geral" subtitle={formatDataLonga(r.dataDomingo)} texto={textoRelatorio(r)} />
    </div>
  );
}
