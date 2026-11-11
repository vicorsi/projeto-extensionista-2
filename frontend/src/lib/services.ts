import { api } from './api';
import type {
  Aula,
  AulaUpdatePayload,
  AuthResponse,
  Chamada,
  ChamadaUpsertPayload,
  Classe,
  ClassePayload,
  Escala,
  EscalaUpsertPayload,
  Membro,
  MembroPayload,
  PlanoLicao,
  PlanoLicaoPayload,
  RegisterPayload,
  RelatorioConsolidado,
  TipoMembro,
  Usuario,
  UsuarioPayload,
} from './types';

export const authApi = {
  login: (email: string, senha: string) => api.post<AuthResponse>('/auth/login', { email, senha }).then((r) => r.data),
  register: (dados: RegisterPayload) => api.post<AuthResponse>('/auth/register', dados).then((r) => r.data),
  me: () => api.get<Usuario>('/auth/me').then((r) => r.data),
};

export const usuariosApi = {
  list: () => api.get<Usuario[]>('/usuarios').then((r) => r.data),
  create: (d: UsuarioPayload) => api.post<Usuario>('/usuarios', d).then((r) => r.data),
  update: (id: string, d: UsuarioPayload) => api.put<Usuario>(`/usuarios/${id}`, d).then((r) => r.data),
  remove: (id: string) => api.delete(`/usuarios/${id}`).then(() => undefined),
};

export const classesApi = {
  list: () => api.get<Classe[]>('/classes').then((r) => r.data),
  create: (d: ClassePayload) => api.post<Classe>('/classes', d).then((r) => r.data),
  update: (id: string, d: ClassePayload) => api.put<Classe>(`/classes/${id}`, d).then((r) => r.data),
  remove: (id: string) => api.delete(`/classes/${id}`).then(() => undefined),
};

export const membrosApi = {
  list: (params: { classeId?: string; tipo?: TipoMembro } = {}) =>
    api.get<Membro[]>('/membros', { params }).then((r) => r.data),
  create: (d: MembroPayload) => api.post<Membro>('/membros', d).then((r) => r.data),
  update: (id: string, d: MembroPayload) => api.put<Membro>(`/membros/${id}`, d).then((r) => r.data),
  remove: (id: string) => api.delete(`/membros/${id}`).then(() => undefined),
};

export const planosApi = {
  list: (classeId?: string) =>
    api.get<PlanoLicao[]>('/planos-licoes', { params: classeId ? { classeId } : {} }).then((r) => r.data),
  create: (d: PlanoLicaoPayload) => api.post<PlanoLicao>('/planos-licoes', d).then((r) => r.data),
  update: (id: string, d: PlanoLicaoPayload) => api.put<PlanoLicao>(`/planos-licoes/${id}`, d).then((r) => r.data),
  remove: (id: string) => api.delete(`/planos-licoes/${id}`).then(() => undefined),
};

export const aulasApi = {
  obterOuCriar: (classeId: string, dataAula: string) =>
    api.post<Aula>('/aulas/obter-ou-criar', { classeId, dataAula }).then((r) => r.data),
  update: (id: string, d: AulaUpdatePayload) => api.put<Aula>(`/aulas/${id}`, d).then((r) => r.data),
  historico: (classeId: string) => api.get<Aula[]>('/aulas/historico', { params: { classeId } }).then((r) => r.data),
};

export const chamadasApi = {
  list: (aulaId: string) => api.get<Chamada[]>('/chamadas', { params: { aulaId } }).then((r) => r.data),
  upsert: (d: ChamadaUpsertPayload) => api.put<Chamada>('/chamadas/upsert', d).then((r) => r.data),
  marcarTodos: (aulaId: string) => api.post<Chamada[]>('/chamadas/marcar-todos', { aulaId }).then((r) => r.data),
  resetar: (aulaId: string) => api.post<Chamada[]>('/chamadas/resetar', { aulaId }).then((r) => r.data),
};

export const escalasApi = {
  list: (dataDomingo: string) => api.get<Escala[]>('/escalas', { params: { dataDomingo } }).then((r) => r.data),
  /** Retorna null quando a escala foi removida (professor não informado). */
  upsert: (d: EscalaUpsertPayload) =>
    api.put<Escala | ''>('/escalas/upsert', d).then((r) => (r.status === 204 || !r.data ? null : r.data)),
  replicarTitulares: (dataDomingo: string) =>
    api.post<Escala[]>('/escalas/replicar-titulares', null, { params: { dataDomingo } }).then((r) => r.data),
};

export const relatoriosApi = {
  consolidado: (dataDomingo: string) =>
    api.get<RelatorioConsolidado>('/relatorios/consolidado', { params: { dataDomingo } }).then((r) => r.data),
};
