import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';
import { chamadasApi } from '@/lib/services';
import type { Chamada } from '@/lib/types';

export interface EstadoChamada {
  presente: boolean;
  trouxeBiblia: boolean;
  trouxeRevista: boolean;
}

export type CampoChamada = keyof EstadoChamada;
export type StatusSalvamento = 'saving' | 'saved' | 'error';

export const VAZIO: EstadoChamada = { presente: false, trouxeBiblia: false, trouxeRevista: false };

/**
 * Regras de negócio da chamada:
 * - marcar Bíblia ou Revista ⇒ Presente = true
 * - desmarcar Presente ⇒ Bíblia = Revista = false
 */
export function aplicarRegra(atual: EstadoChamada, campo: CampoChamada): EstadoChamada {
  const novo = { ...atual, [campo]: !atual[campo] };
  if (campo === 'presente' && !novo.presente) return { ...VAZIO };
  if (campo !== 'presente' && novo[campo]) novo.presente = true;
  return novo;
}

function paraMapa(lista: Chamada[] | undefined): Record<string, EstadoChamada> {
  const mapa: Record<string, EstadoChamada> = {};
  for (const c of lista ?? []) {
    mapa[c.membroId] = { presente: c.presente, trouxeBiblia: c.trouxeBiblia, trouxeRevista: c.trouxeRevista };
  }
  return mapa;
}

/**
 * Estado local da chamada com Optimistic UI.
 * A tela muda imediatamente; as gravações são enfileiradas por aluno (uma requisição por vez,
 * sempre enviando o estado mais recente), evitando corrida entre toques rápidos.
 */
export function useChamadaOtimista(aulaId: string | undefined, dados: Chamada[] | undefined) {
  const [registros, setRegistros] = useState<Record<string, EstadoChamada>>({});
  const [status, setStatus] = useState<Record<string, StatusSalvamento>>({});

  const confirmados = useRef<Record<string, EstadoChamada>>({});
  const pendentes = useRef(new Map<string, EstadoChamada>());
  const emVoo = useRef(new Set<string>());
  const aulaAtual = useRef(aulaId);
  aulaAtual.current = aulaId;

  useEffect(() => {
    const mapa = paraMapa(dados);
    setRegistros(mapa);
    setStatus({});
    if (aulaId) {
      for (const [membroId, estado] of Object.entries(mapa)) {
        confirmados.current[`${aulaId}:${membroId}`] = estado;
      }
    }
  }, [dados, aulaId]);

  const definirStatus = useCallback((aId: string, membroId: string, s: StatusSalvamento | null) => {
    if (aulaAtual.current !== aId) return;
    setStatus((prev) => {
      const novo = { ...prev };
      if (s) novo[membroId] = s;
      else delete novo[membroId];
      return novo;
    });
  }, []);

  const processar = useCallback(
    async (aId: string, membroId: string) => {
      const chave = `${aId}:${membroId}`;
      emVoo.current.add(chave);
      definirStatus(aId, membroId, 'saving');
      let erro: unknown = null;

      while (pendentes.current.has(chave)) {
        const valor = pendentes.current.get(chave)!;
        pendentes.current.delete(chave);
        try {
          await chamadasApi.upsert({ aulaId: aId, membroId, ...valor });
          confirmados.current[chave] = valor;
          erro = null;
        } catch (e) {
          erro = e;
        }
      }
      emVoo.current.delete(chave);

      if (erro) {
        toast.error(getErrorMessage(erro, 'Não foi possível salvar. Verifique a conexão e tente de novo.'));
        if (aulaAtual.current === aId) {
          setRegistros((prev) => ({ ...prev, [membroId]: confirmados.current[chave] ?? VAZIO }));
        }
        definirStatus(aId, membroId, 'error');
      } else {
        definirStatus(aId, membroId, 'saved');
        window.setTimeout(() => {
          if (aulaAtual.current !== aId) return;
          setStatus((prev) => {
            if (prev[membroId] !== 'saved') return prev;
            const novo = { ...prev };
            delete novo[membroId];
            return novo;
          });
        }, 2000);
      }
    },
    [definirStatus],
  );

  const definir = useCallback(
    (membroId: string, estado: EstadoChamada) => {
      const aId = aulaAtual.current;
      if (!aId) return;
      setRegistros((prev) => ({ ...prev, [membroId]: estado }));
      const chave = `${aId}:${membroId}`;
      pendentes.current.set(chave, estado);
      if (!emVoo.current.has(chave)) void processar(aId, membroId);
    },
    [processar],
  );

  const registrosRef = useRef(registros);
  registrosRef.current = registros;

  const alternar = useCallback(
    (membroId: string, campo: CampoChamada) => {
      const novo = aplicarRegra(registrosRef.current[membroId] ?? VAZIO, campo);
      registrosRef.current = { ...registrosRef.current, [membroId]: novo };
      definir(membroId, novo);
    },
    [definir],
  );

  /** Substitui todo o estado (após "Marcar todos" / "Resetar"). */
  const substituirTodos = useCallback((lista: Chamada[]) => {
    const aId = aulaAtual.current;
    const mapa = paraMapa(lista);
    setRegistros(mapa);
    setStatus({});
    if (aId) {
      for (const chave of Object.keys(confirmados.current)) {
        if (chave.startsWith(`${aId}:`)) delete confirmados.current[chave];
      }
      for (const [membroId, estado] of Object.entries(mapa)) {
        confirmados.current[`${aId}:${membroId}`] = estado;
      }
    }
  }, []);

  const salvando = Object.values(status).some((s) => s === 'saving');

  return { registros, status, alternar, definir, substituirTodos, salvando };
}
