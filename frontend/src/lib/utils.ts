import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Papel, PapelEscala, StatusAula, TipoMembro } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------- Datas (sempre no fuso local, formato ISO YYYY-MM-DD) ----------

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12);
}

export function addDays(iso: string, dias: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + dias);
  return toISODate(d);
}

/** Hoje, se for domingo; senão, o próximo domingo. */
export function proximoDomingo(base: Date = new Date()): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12);
  const faltam = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + faltam);
  return toISODate(d);
}

export function isDomingo(iso: string): boolean {
  return parseISODate(iso).getDay() === 0;
}

const fmtLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
const fmtCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtMedia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

export function formatDataLonga(iso: string): string {
  const s = fmtLonga.format(parseISODate(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDataCurta(iso: string | null | undefined): string {
  return iso ? fmtCurta.format(parseISODate(iso)) : '—';
}

export function formatDataMedia(iso: string): string {
  return fmtMedia.format(parseISODate(iso)).replace('.', '');
}

// ---------- Moeda ----------

const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatMoeda(valor: number | null | undefined): string {
  return fmtMoeda.format(Number(valor ?? 0));
}

/** "12,50" → "12,50" para campo de edição. */
export function numeroParaCampo(valor: number | null | undefined): string {
  if (valor == null) return '';
  return Number(valor).toFixed(2).replace('.', ',');
}

/**
 * Converte texto digitado em número. Aceita "1.234,56", "12,5", "12.50" e "R$ 10".
 * Retorna null para vazio e undefined para valor inválido.
 */
export function parseMoeda(texto: string): number | null | undefined {
  let t = texto.replace(/R\$/gi, '').replace(/\s/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}

// ---------- Rótulos ----------

export const papelLabel: Record<Papel, string> = {
  SUPERINTENDENTE: 'Superintendente',
  PROFESSOR: 'Professor(a)',
  ALUNO: 'Aluno(a)',
};

export const papelEscalaLabel: Record<PapelEscala, string> = {
  TITULAR: 'Titular',
  SUBSTITUTO: 'Substituto',
  AUXILIAR: 'Auxiliar',
};

export const tipoMembroLabel: Record<TipoMembro, string> = {
  MEMBRO: 'Membro',
  VISITANTE: 'Visitante',
};

export function statusAulaLabel(status: StatusAula | null | undefined): string {
  if (status === 'CONCLUIDA') return 'Concluída';
  if (status === 'ABERTA') return 'Em andamento';
  return 'Não iniciada';
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] ?? '' : '';
  return (primeira + ultima).toUpperCase();
}

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// ---------- Compartilhamento ----------

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* tenta o fallback abaixo */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function whatsappUrl(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

// ---------- Armazenamento local (preferências do usuário) ----------

export function lerPreferencia(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

export function salvarPreferencia(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* ignorado */
  }
}
