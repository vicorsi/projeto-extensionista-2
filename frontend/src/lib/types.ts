export type Papel = 'SUPERINTENDENTE' | 'PROFESSOR' | 'ALUNO';
export type TipoMembro = 'MEMBRO' | 'VISITANTE';
export type StatusAula = 'ABERTA' | 'CONCLUIDA';
export type PapelEscala = 'TITULAR' | 'SUBSTITUTO' | 'AUXILIAR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
}

export interface UsuarioPayload {
  nome: string;
  email: string;
  senha?: string;
  papel: Papel;
}

export interface Classe {
  id: string;
  nome: string;
  faixaEtaria: string | null;
  descricao: string | null;
  professorTitularId: string | null;
  professorTitularNome: string | null;
  totalMembros: number;
  createdAt: string;
}

export interface ClassePayload {
  nome: string;
  faixaEtaria?: string | null;
  descricao?: string | null;
  professorTitularId?: string | null;
}

export interface Membro {
  id: string;
  nome: string;
  classeId: string;
  classeNome: string;
  tipoMembro: TipoMembro;
  telefone: string | null;
  ativo: boolean;
  createdAt: string;
}

export interface MembroPayload {
  nome: string;
  classeId: string;
  tipoMembro: TipoMembro;
  telefone?: string | null;
  ativo?: boolean;
}

export interface PlanoLicao {
  id: string;
  classeId: string;
  classeNome: string;
  numeroLicao: number | null;
  titulo: string;
  textoBiblico: string | null;
  dataSugerida: string | null;
}

export interface PlanoLicaoPayload {
  classeId: string;
  numeroLicao?: number | null;
  titulo: string;
  textoBiblico?: string | null;
  dataSugerida?: string | null;
}

export interface Aula {
  id: string;
  classeId: string;
  classeNome: string;
  dataAula: string;
  numeroLicao: number | null;
  temaLicao: string | null;
  leituraBiblica: string | null;
  valorOferta: number | null;
  status: StatusAula;
  presentes: number;
  createdAt: string;
}

export interface AulaUpdatePayload {
  numeroLicao: number | null;
  temaLicao: string | null;
  leituraBiblica: string | null;
  valorOferta: number | null;
  status: StatusAula;
}

export interface Chamada {
  id: string;
  aulaId: string;
  membroId: string;
  presente: boolean;
  trouxeBiblia: boolean;
  trouxeRevista: boolean;
  updatedAt: string;
}

export interface ChamadaUpsertPayload {
  aulaId: string;
  membroId: string;
  presente: boolean;
  trouxeBiblia: boolean;
  trouxeRevista: boolean;
}

export interface Escala {
  id: string;
  classeId: string;
  classeNome: string;
  professorId: string;
  professorNome: string;
  dataDomingo: string;
  papelEscala: PapelEscala;
  observacao: string | null;
}

export interface EscalaUpsertPayload {
  classeId: string;
  dataDomingo: string;
  professorId: string | null;
  papelEscala: PapelEscala;
  observacao?: string | null;
}

export interface RelatorioClasse {
  classeId: string;
  classeNome: string;
  professorEscalado: string | null;
  aulaId: string | null;
  status: StatusAula | null;
  numeroLicao: number | null;
  temaLicao: string | null;
  matriculados: number;
  presentes: number;
  ausentes: number;
  frequencia: number;
  biblias: number;
  revistas: number;
  visitantes: number;
  oferta: number;
}

export interface RelatorioConsolidado {
  dataDomingo: string;
  totalClasses: number;
  aulasIniciadas: number;
  aulasConcluidas: number;
  matriculados: number;
  presentes: number;
  ausentes: number;
  frequencia: number;
  biblias: number;
  revistas: number;
  visitantes: number;
  totalOfertas: number;
  classes: RelatorioClasse[];
}
