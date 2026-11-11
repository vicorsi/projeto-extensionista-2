/**
 * Backend simulado (modo demonstração).
 * Ativado com VITE_MOCK=true: substitui o adapter do Axios e responde às rotas da API
 * localmente, persistindo os dados no localStorage do navegador.
 * Reproduz as regras do backend Spring Boot (chamada, escala, relatório, permissões).
 */
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type {
  Aula,
  Chamada,
  Classe,
  Escala,
  Membro,
  Papel,
  PapelEscala,
  PlanoLicao,
  RelatorioClasse,
  RelatorioConsolidado,
  StatusAula,
  TipoMembro,
  Usuario,
} from '../types';
import { addDays, proximoDomingo } from '../utils';

// ---------- Modelo armazenado ----------

interface UsuarioDb extends Usuario {
  senha: string;
}
interface ClasseDb {
  id: string;
  nome: string;
  faixaEtaria: string | null;
  descricao: string | null;
  professorTitularId: string | null;
  createdAt: string;
}
interface MembroDb {
  id: string;
  nome: string;
  classeId: string;
  tipoMembro: TipoMembro;
  telefone: string | null;
  ativo: boolean;
  createdAt: string;
}
interface PlanoDb {
  id: string;
  classeId: string;
  numeroLicao: number | null;
  titulo: string;
  textoBiblico: string | null;
  dataSugerida: string | null;
}
interface AulaDb {
  id: string;
  classeId: string;
  dataAula: string;
  numeroLicao: number | null;
  temaLicao: string | null;
  leituraBiblica: string | null;
  valorOferta: number | null;
  status: StatusAula;
  createdAt: string;
}
interface EscalaDb {
  id: string;
  classeId: string;
  professorId: string;
  dataDomingo: string;
  papelEscala: PapelEscala;
  observacao: string | null;
}
interface Db {
  versao: number;
  usuarios: UsuarioDb[];
  classes: ClasseDb[];
  membros: MembroDb[];
  planos: PlanoDb[];
  aulas: AulaDb[];
  chamadas: Chamada[];
  escalas: EscalaDb[];
}

const DB_KEY = 'ebd.mock.db';
const DB_VERSAO = 1;
export const SENHA_DEMO = '123456';

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
const agora = () => new Date().toISOString();
const limpar = (s: unknown) => (typeof s === 'string' && s.trim() ? s.trim() : null);
const porNome = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

// ---------- Dados de demonstração ----------

function semear(): Db {
  const db: Db = { versao: DB_VERSAO, usuarios: [], classes: [], membros: [], planos: [], aulas: [], chamadas: [], escalas: [] };
  const criado = agora();

  const usuario = (nome: string, email: string, papel: Papel) => {
    const u: UsuarioDb = { id: uuid(), nome, email, papel, senha: SENHA_DEMO, createdAt: criado };
    db.usuarios.push(u);
    return u;
  };
  usuario('Marcos Oliveira', 'super@demo.com', 'SUPERINTENDENTE');
  const ana = usuario('Ana Paula Souza', 'professor@demo.com', 'PROFESSOR');
  const joao = usuario('João Batista Lima', 'joao@demo.com', 'PROFESSOR');
  const ruth = usuario('Ruth Almeida', 'ruth@demo.com', 'PROFESSOR');
  const davi = usuario('Davi Santos', 'davi@demo.com', 'PROFESSOR');

  const classe = (nome: string, faixaEtaria: string, titular: UsuarioDb | null, descricao: string | null = null) => {
    const c: ClasseDb = { id: uuid(), nome, faixaEtaria, descricao, professorTitularId: titular?.id ?? null, createdAt: criado };
    db.classes.push(c);
    return c;
  };
  const criancas = classe('Crianças', '6 a 11 anos', ruth, 'Sala 2, ao lado da secretaria.');
  const adolescentes = classe('Adolescentes', '12 a 17 anos', davi);
  const jovens = classe('Jovens', '18 a 30 anos', joao);
  const adultos = classe('Adultos', 'Acima de 30 anos', ana, 'Templo principal.');

  const nomes: Record<string, { membros: string[]; visitantes: string[] }> = {
    [criancas.id]: {
      membros: ['Alice Ferreira', 'Benjamin Rocha', 'Helena Costa', 'Lucas Martins', 'Manuela Dias', 'Samuel Araújo', 'Sofia Ribeiro'],
      visitantes: ['Pedro Henrique'],
    },
    [adolescentes.id]: {
      membros: ['Beatriz Nunes', 'Caio Pereira', 'Gabriel Moreira', 'Isabela Teixeira', 'Rafael Gomes', 'Yasmin Cardoso'],
      visitantes: [],
    },
    [jovens.id]: {
      membros: ['Ana Clara Mendes', 'Bruno Carvalho', 'Débora Vieira', 'Felipe Barbosa', 'Larissa Freitas', 'Mateus Pinto', 'Priscila Lopes', 'Tiago Monteiro'],
      visitantes: ['Juliana Prado'],
    },
    [adultos.id]: {
      membros: [
        'Antônio Ramos', 'Cláudia Ribeiro', 'Eliane Duarte', 'Francisco Silva', 'Josué Andrade',
        'Lúcia Fernandes', 'Marta Correia', 'Paulo Nascimento', 'Raquel Moura', 'Sebastião Cruz',
      ],
      visitantes: ['Roberto Farias', 'Sandra Campos'],
    },
  };
  for (const [classeId, grupo] of Object.entries(nomes)) {
    grupo.membros.forEach((nome, i) =>
      db.membros.push({
        id: uuid(),
        nome,
        classeId,
        tipoMembro: 'MEMBRO',
        telefone: i % 3 === 0 ? `(11) 9${String(8000 + i * 137).padStart(4, '0')}-${String(1000 + i * 271).slice(0, 4)}` : null,
        ativo: true,
        createdAt: criado,
      }),
    );
    grupo.visitantes.forEach((nome) =>
      db.membros.push({ id: uuid(), nome, classeId, tipoMembro: 'VISITANTE', telefone: null, ativo: true, createdAt: criado }),
    );
  }

  // Lições do trimestre: 13 domingos a partir de 6 semanas atrás.
  const domingo = proximoDomingo();
  const inicio = addDays(domingo, -7 * 6);
  const temas = [
    ['A criação de Deus', 'Gênesis 1.1-31'],
    ['A queda do homem', 'Gênesis 3.1-24'],
    ['A fé de Abraão', 'Gênesis 12.1-9'],
    ['José e seus irmãos', 'Gênesis 37.1-36'],
    ['O chamado de Moisés', 'Êxodo 3.1-15'],
    ['A travessia do Mar Vermelho', 'Êxodo 14.10-31'],
    ['Os Dez Mandamentos', 'Êxodo 20.1-17'],
    ['A conquista de Jericó', 'Josué 6.1-27'],
    ['Rute, exemplo de fidelidade', 'Rute 1.1-22'],
    ['Davi e Golias', '1 Samuel 17.32-51'],
    ['A sabedoria de Salomão', '1 Reis 3.5-15'],
    ['Elias no monte Carmelo', '1 Reis 18.20-39'],
    ['Daniel na cova dos leões', 'Daniel 6.1-28'],
  ];
  for (const c of db.classes) {
    temas.forEach(([titulo, texto], i) =>
      db.planos.push({ id: uuid(), classeId: c.id, numeroLicao: i + 1, titulo, textoBiblico: texto, dataSugerida: addDays(inicio, i * 7) }),
    );
  }

  // Aulas dos últimos 6 domingos, com chamada preenchida de forma determinística.
  let semente = 7;
  const aleatorio = () => {
    semente = (semente * 9301 + 49297) % 233280;
    return semente / 233280;
  };
  for (let s = 6; s >= 1; s--) {
    const data = addDays(domingo, -7 * s);
    const indice = 6 - s;
    for (const c of db.classes) {
      const aula: AulaDb = {
        id: uuid(),
        classeId: c.id,
        dataAula: data,
        numeroLicao: indice + 1,
        temaLicao: temas[indice][0],
        leituraBiblica: temas[indice][1],
        valorOferta: Math.round((20 + aleatorio() * 140) * 100) / 100,
        status: 'CONCLUIDA',
        createdAt: criado,
      };
      db.aulas.push(aula);
      for (const m of db.membros.filter((x) => x.classeId === c.id)) {
        const presente = m.tipoMembro === 'VISITANTE' ? aleatorio() < 0.4 : aleatorio() < 0.82;
        if (!presente && aleatorio() < 0.5) continue;
        db.chamadas.push({
          id: uuid(),
          aulaId: aula.id,
          membroId: m.id,
          presente,
          trouxeBiblia: presente && aleatorio() < 0.75,
          trouxeRevista: presente && aleatorio() < 0.6,
          updatedAt: criado,
        });
      }
    }
    db.classes.forEach((c) =>
      db.escalas.push({ id: uuid(), classeId: c.id, professorId: c.professorTitularId!, dataDomingo: data, papelEscala: 'TITULAR', observacao: null }),
    );
  }

  // Escala parcial do próximo domingo.
  db.escalas.push(
    { id: uuid(), classeId: adultos.id, professorId: ana.id, dataDomingo: domingo, papelEscala: 'TITULAR', observacao: null },
    { id: uuid(), classeId: jovens.id, professorId: ana.id, dataDomingo: domingo, papelEscala: 'SUBSTITUTO', observacao: 'João em viagem' },
  );
  return db;
}

let cache: Db | null = null;

function carregar(): Db {
  if (cache) return cache;
  try {
    const bruto = localStorage.getItem(DB_KEY);
    if (bruto) {
      const db = JSON.parse(bruto) as Db;
      if (db.versao === DB_VERSAO) return (cache = db);
    }
  } catch {
    /* armazenamento indisponível ou corrompido */
  }
  cache = semear();
  persistir();
  return cache;
}

function persistir() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache));
  } catch {
    /* armazenamento indisponível: mantém só em memória */
  }
}

/** Apaga as alterações e recria os dados de demonstração. */
export function restaurarDemo() {
  cache = semear();
  persistir();
}

// ---------- Projeções (equivalentes aos DTOs) ----------

const semSenha = ({ senha: _senha, ...u }: UsuarioDb): Usuario => u;

function toClasse(db: Db, c: ClasseDb): Classe {
  return {
    ...c,
    professorTitularNome: db.usuarios.find((u) => u.id === c.professorTitularId)?.nome ?? null,
    totalMembros: db.membros.filter((m) => m.classeId === c.id && m.ativo).length,
  };
}
const nomeClasse = (db: Db, id: string) => db.classes.find((c) => c.id === id)?.nome ?? '';
const toMembro = (db: Db, m: MembroDb): Membro => ({ ...m, classeNome: nomeClasse(db, m.classeId) });
const toPlano = (db: Db, p: PlanoDb): PlanoLicao => ({ ...p, classeNome: nomeClasse(db, p.classeId) });
const presentesDaAula = (db: Db, aulaId: string) => db.chamadas.filter((c) => c.aulaId === aulaId && c.presente).length;
const toAula = (db: Db, a: AulaDb): Aula => ({ ...a, classeNome: nomeClasse(db, a.classeId), presentes: presentesDaAula(db, a.id) });
const toEscala = (db: Db, e: EscalaDb): Escala => ({
  ...e,
  classeNome: nomeClasse(db, e.classeId),
  professorNome: db.usuarios.find((u) => u.id === e.professorId)?.nome ?? '',
});

// ---------- Infra de rotas ----------

class HttpErro extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const naoEncontrado = (msg: string) => new HttpErro(404, msg);
const invalido = (msg: string) => new HttpErro(400, msg);

interface Req {
  metodo: string;
  params: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  eu: UsuarioDb | null;
}
type Handler = (db: Db, req: Req) => unknown;
interface Rota {
  metodo: string;
  padrao: RegExp;
  chaves: string[];
  acesso: 'publico' | 'autenticado' | 'equipe' | 'super';
  handler: Handler;
}
const rotas: Rota[] = [];

function rota(metodo: string, caminho: string, acesso: Rota['acesso'], handler: Handler) {
  const chaves: string[] = [];
  const padrao = new RegExp(
    '^' +
      caminho.replace(/:(\w+)/g, (_, k: string) => {
        chaves.push(k);
        return '([^/]+)';
      }) +
      '/?$',
  );
  rotas.push({ metodo, padrao, chaves, acesso, handler });
}

function obter<T extends { id: string }>(lista: T[], id: string | undefined, msg: string): T {
  const item = lista.find((x) => x.id === id);
  if (!item) throw naoEncontrado(msg);
  return item;
}

function token(u: UsuarioDb) {
  return `mock.${u.id}`;
}

function validarUsuario(db: Db, body: Req['body'], idAtual: string | null) {
  const nome = limpar(body?.nome);
  const email = limpar(body?.email)?.toLowerCase();
  if (!nome) throw invalido('Informe o nome');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw invalido('Informe um e-mail válido');
  if (db.usuarios.some((u) => u.email.toLowerCase() === email && u.id !== idAtual)) throw new HttpErro(409, 'Este e-mail já está cadastrado');
  return { nome, email };
}

// ---------- Rotas: autenticação ----------

rota('post', '/auth/login', 'publico', (db, { body }) => {
  const email = String(body?.email ?? '').trim().toLowerCase();
  const u = db.usuarios.find((x) => x.email.toLowerCase() === email);
  if (!u || u.senha !== body?.senha) throw new HttpErro(401, 'E-mail ou senha inválidos');
  return { token: token(u), usuario: semSenha(u) };
});

rota('post', '/auth/register', 'publico', (db, { body }) => {
  const { nome, email } = validarUsuario(db, body, null);
  if (String(body?.senha ?? '').length < 6) throw invalido('A senha deve ter no mínimo 6 caracteres');
  const papel: Papel = body?.papel === 'SUPERINTENDENTE' ? 'SUPERINTENDENTE' : 'PROFESSOR';
  const u: UsuarioDb = { id: uuid(), nome, email, papel, senha: body.senha, createdAt: agora() };
  db.usuarios.push(u);
  return { token: token(u), usuario: semSenha(u) };
});

rota('get', '/auth/me', 'autenticado', (_db, { eu }) => semSenha(eu!));

// ---------- Rotas: usuários ----------

rota('get', '/usuarios', 'super', (db) => [...db.usuarios].sort((a, b) => porNome(a.nome, b.nome)).map(semSenha));

rota('post', '/usuarios', 'super', (db, { body }) => {
  const { nome, email } = validarUsuario(db, body, null);
  if (String(body?.senha ?? '').length < 6) throw invalido('A senha deve ter no mínimo 6 caracteres');
  const u: UsuarioDb = { id: uuid(), nome, email, papel: body.papel ?? 'PROFESSOR', senha: body.senha, createdAt: agora() };
  db.usuarios.push(u);
  return semSenha(u);
});

rota('put', '/usuarios/:id', 'super', (db, { params, body, eu }) => {
  const u = obter(db.usuarios, params.id, 'Usuário não encontrado');
  const { nome, email } = validarUsuario(db, body, u.id);
  const papel: Papel = body?.papel ?? u.papel;
  if (u.papel === 'SUPERINTENDENTE' && papel !== 'SUPERINTENDENTE') {
    if (u.id === eu!.id) throw invalido('Você não pode remover sua própria função de superintendente');
    if (db.usuarios.filter((x) => x.papel === 'SUPERINTENDENTE').length <= 1) throw invalido('É necessário manter ao menos um superintendente');
  }
  if (body?.senha) {
    if (String(body.senha).length < 6) throw invalido('A senha deve ter no mínimo 6 caracteres');
    u.senha = body.senha;
  }
  Object.assign(u, { nome, email, papel });
  return semSenha(u);
});

rota('delete', '/usuarios/:id', 'super', (db, { params, eu }) => {
  const u = obter(db.usuarios, params.id, 'Usuário não encontrado');
  if (u.id === eu!.id) throw invalido('Você não pode excluir a si mesmo');
  if (u.papel === 'SUPERINTENDENTE' && db.usuarios.filter((x) => x.papel === 'SUPERINTENDENTE').length <= 1)
    throw invalido('É necessário manter ao menos um superintendente');
  db.usuarios = db.usuarios.filter((x) => x.id !== u.id);
  db.escalas = db.escalas.filter((e) => e.professorId !== u.id);
  db.classes.forEach((c) => {
    if (c.professorTitularId === u.id) c.professorTitularId = null;
  });
});

// ---------- Rotas: classes ----------

function validarClasse(db: Db, body: Req['body'], idAtual: string | null) {
  const nome = limpar(body?.nome);
  if (!nome) throw invalido('Informe o nome da classe');
  if (db.classes.some((c) => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== idAtual))
    throw new HttpErro(409, 'Já existe uma classe com este nome');
  const professorTitularId = limpar(body?.professorTitularId);
  if (professorTitularId) obter(db.usuarios, professorTitularId, 'Professor não encontrado');
  return { nome, faixaEtaria: limpar(body?.faixaEtaria), descricao: limpar(body?.descricao), professorTitularId };
}

rota('get', '/classes', 'equipe', (db) => [...db.classes].sort((a, b) => porNome(a.nome, b.nome)).map((c) => toClasse(db, c)));

rota('post', '/classes', 'super', (db, { body }) => {
  const c: ClasseDb = { id: uuid(), ...validarClasse(db, body, null), createdAt: agora() };
  db.classes.push(c);
  return toClasse(db, c);
});

rota('put', '/classes/:id', 'super', (db, { params, body }) => {
  const c = obter(db.classes, params.id, 'Classe não encontrada');
  Object.assign(c, validarClasse(db, body, c.id));
  return toClasse(db, c);
});

rota('delete', '/classes/:id', 'super', (db, { params }) => {
  const c = obter(db.classes, params.id, 'Classe não encontrada');
  const aulas = new Set(db.aulas.filter((a) => a.classeId === c.id).map((a) => a.id));
  db.chamadas = db.chamadas.filter((x) => !aulas.has(x.aulaId));
  db.aulas = db.aulas.filter((a) => a.classeId !== c.id);
  db.membros = db.membros.filter((m) => m.classeId !== c.id);
  db.planos = db.planos.filter((p) => p.classeId !== c.id);
  db.escalas = db.escalas.filter((e) => e.classeId !== c.id);
  db.classes = db.classes.filter((x) => x.id !== c.id);
});

// ---------- Rotas: membros ----------

function aplicarMembro(db: Db, m: Partial<MembroDb>, body: Req['body']) {
  const nome = limpar(body?.nome);
  if (!nome) throw invalido('Informe o nome');
  obter(db.classes, body?.classeId, 'Classe não encontrada');
  m.nome = nome;
  m.classeId = body.classeId;
  m.tipoMembro = body?.tipoMembro === 'VISITANTE' ? 'VISITANTE' : 'MEMBRO';
  m.telefone = limpar(body?.telefone);
  if (typeof body?.ativo === 'boolean') m.ativo = body.ativo;
}

rota('get', '/membros', 'equipe', (db, { query }) =>
  db.membros
    .filter((m) => (!query.classeId || m.classeId === query.classeId) && (!query.tipo || m.tipoMembro === query.tipo))
    .sort((a, b) => porNome(a.nome, b.nome))
    .map((m) => toMembro(db, m)),
);

rota('post', '/membros', 'equipe', (db, { body }) => {
  const m = { id: uuid(), ativo: true, createdAt: agora() } as MembroDb;
  aplicarMembro(db, m, body);
  db.membros.push(m);
  return toMembro(db, m);
});

rota('put', '/membros/:id', 'super', (db, { params, body }) => {
  const m = obter(db.membros, params.id, 'Aluno não encontrado');
  aplicarMembro(db, m, body);
  return toMembro(db, m);
});

rota('delete', '/membros/:id', 'super', (db, { params }) => {
  obter(db.membros, params.id, 'Aluno não encontrado');
  db.chamadas = db.chamadas.filter((c) => c.membroId !== params.id);
  db.membros = db.membros.filter((m) => m.id !== params.id);
});

// ---------- Rotas: planos de lição ----------

function aplicarPlano(db: Db, p: Partial<PlanoDb>, body: Req['body']) {
  const titulo = limpar(body?.titulo);
  if (!titulo) throw invalido('Informe o título da lição');
  obter(db.classes, body?.classeId, 'Classe não encontrada');
  const numero = body?.numeroLicao == null ? null : Number(body.numeroLicao);
  if (numero != null && db.planos.some((x) => x.classeId === body.classeId && x.numeroLicao === numero && x.id !== p.id))
    throw new HttpErro(409, `Já existe a lição ${numero} nesta classe`);
  Object.assign(p, {
    classeId: body.classeId,
    numeroLicao: numero,
    titulo,
    textoBiblico: limpar(body?.textoBiblico),
    dataSugerida: limpar(body?.dataSugerida),
  });
}

rota('get', '/planos-licoes', 'equipe', (db, { query }) =>
  db.planos
    .filter((p) => !query.classeId || p.classeId === query.classeId)
    .map((p) => toPlano(db, p))
    .sort((a, b) => porNome(a.classeNome, b.classeNome) || (a.numeroLicao ?? Infinity) - (b.numeroLicao ?? Infinity)),
);

rota('post', '/planos-licoes', 'super', (db, { body }) => {
  const p = { id: uuid() } as PlanoDb;
  aplicarPlano(db, p, body);
  db.planos.push(p);
  return toPlano(db, p);
});

rota('put', '/planos-licoes/:id', 'super', (db, { params, body }) => {
  const p = obter(db.planos, params.id, 'Lição não encontrada');
  aplicarPlano(db, p, body);
  return toPlano(db, p);
});

rota('delete', '/planos-licoes/:id', 'super', (db, { params }) => {
  obter(db.planos, params.id, 'Lição não encontrada');
  db.planos = db.planos.filter((p) => p.id !== params.id);
});

// ---------- Rotas: aulas ----------

rota('post', '/aulas/obter-ou-criar', 'equipe', (db, { body }) => {
  obter(db.classes, body?.classeId, 'Classe não encontrada');
  if (!body?.dataAula) throw invalido('Informe a data da aula');
  let aula = db.aulas.find((a) => a.classeId === body.classeId && a.dataAula === body.dataAula);
  if (!aula) {
    aula = {
      id: uuid(),
      classeId: body.classeId,
      dataAula: body.dataAula,
      numeroLicao: null,
      temaLicao: null,
      leituraBiblica: null,
      valorOferta: null,
      status: 'ABERTA',
      createdAt: agora(),
    };
    db.aulas.push(aula);
  }
  return toAula(db, aula);
});

rota('put', '/aulas/:id', 'equipe', (db, { params, body }) => {
  const a = obter(db.aulas, params.id, 'Aula não encontrada');
  a.numeroLicao = body?.numeroLicao ?? null;
  a.temaLicao = limpar(body?.temaLicao);
  a.leituraBiblica = limpar(body?.leituraBiblica);
  a.valorOferta = body?.valorOferta ?? null;
  if (body?.status) a.status = body.status;
  return toAula(db, a);
});

rota('get', '/aulas/historico', 'equipe', (db, { query }) =>
  db.aulas
    .filter((a) => a.classeId === query.classeId)
    .sort((a, b) => b.dataAula.localeCompare(a.dataAula))
    .map((a) => toAula(db, a)),
);

// ---------- Rotas: chamadas ----------

rota('get', '/chamadas', 'equipe', (db, { query }) => db.chamadas.filter((c) => c.aulaId === query.aulaId));

rota('put', '/chamadas/upsert', 'equipe', (db, { body }) => {
  const aula = obter(db.aulas, body?.aulaId, 'Aula não encontrada');
  const membro = obter(db.membros, body?.membroId, 'Aluno não encontrado');
  if (membro.classeId !== aula.classeId) throw invalido('Este aluno não pertence à classe da aula');
  const biblia = body.trouxeBiblia === true;
  const revista = body.trouxeRevista === true;
  const presente = body.presente === true || biblia || revista;
  let c = db.chamadas.find((x) => x.aulaId === aula.id && x.membroId === membro.id);
  if (!c) {
    c = { id: uuid(), aulaId: aula.id, membroId: membro.id, presente: false, trouxeBiblia: false, trouxeRevista: false, updatedAt: agora() };
    db.chamadas.push(c);
  }
  Object.assign(c, { presente, trouxeBiblia: presente && biblia, trouxeRevista: presente && revista, updatedAt: agora() });
  return c;
});

rota('post', '/chamadas/marcar-todos', 'equipe', (db, { body }) => {
  const aula = obter(db.aulas, body?.aulaId, 'Aula não encontrada');
  for (const m of db.membros.filter((x) => x.classeId === aula.classeId && x.ativo)) {
    const c = db.chamadas.find((x) => x.aulaId === aula.id && x.membroId === m.id);
    if (c) Object.assign(c, { presente: true, updatedAt: agora() });
    else db.chamadas.push({ id: uuid(), aulaId: aula.id, membroId: m.id, presente: true, trouxeBiblia: false, trouxeRevista: false, updatedAt: agora() });
  }
  return db.chamadas.filter((c) => c.aulaId === aula.id);
});

rota('post', '/chamadas/resetar', 'equipe', (db, { body }) => {
  const aula = obter(db.aulas, body?.aulaId, 'Aula não encontrada');
  db.chamadas = db.chamadas.filter((c) => c.aulaId !== aula.id);
  return [];
});

// ---------- Rotas: escalas ----------

const escalasDoDia = (db: Db, data: string | undefined) =>
  db.escalas
    .filter((e) => e.dataDomingo === data)
    .map((e) => toEscala(db, e))
    .sort((a, b) => porNome(a.classeNome, b.classeNome));

rota('get', '/escalas', 'equipe', (db, { query }) => escalasDoDia(db, query.dataDomingo));

rota('put', '/escalas/upsert', 'super', (db, { body }) => {
  const existente = db.escalas.find((e) => e.classeId === body?.classeId && e.dataDomingo === body?.dataDomingo);
  if (!body?.professorId) {
    if (existente) db.escalas = db.escalas.filter((e) => e !== existente);
    return null;
  }
  obter(db.classes, body.classeId, 'Classe não encontrada');
  obter(db.usuarios, body.professorId, 'Professor não encontrado');
  const e: EscalaDb = existente ?? { id: uuid(), classeId: body.classeId, dataDomingo: body.dataDomingo, professorId: '', papelEscala: 'TITULAR', observacao: null };
  Object.assign(e, { professorId: body.professorId, papelEscala: body.papelEscala ?? 'TITULAR', observacao: limpar(body.observacao) });
  if (!existente) db.escalas.push(e);
  return toEscala(db, e);
});

rota('post', '/escalas/replicar-titulares', 'super', (db, { query }) => {
  const data = query.dataDomingo;
  const ja = new Set(db.escalas.filter((e) => e.dataDomingo === data).map((e) => e.classeId));
  for (const c of db.classes) {
    if (!c.professorTitularId || ja.has(c.id)) continue;
    db.escalas.push({ id: uuid(), classeId: c.id, professorId: c.professorTitularId, dataDomingo: data!, papelEscala: 'TITULAR', observacao: null });
  }
  return escalasDoDia(db, data);
});

// ---------- Rotas: relatório ----------

const percentual = (parte: number, total: number) => (total <= 0 ? 0 : Math.round((parte * 1000) / total) / 10);

rota('get', '/relatorios/consolidado', 'super', (db, { query }): RelatorioConsolidado => {
  const data = query.dataDomingo ?? proximoDomingo();
  const classes = [...db.classes].sort((a, b) => porNome(a.nome, b.nome));
  const t = { matriculados: 0, presentes: 0, membrosPresentes: 0, biblias: 0, revistas: 0, visitantes: 0, ofertas: 0, iniciadas: 0, concluidas: 0 };

  const linhas: RelatorioClasse[] = classes.map((classe) => {
    const aula = db.aulas.find((a) => a.classeId === classe.id && a.dataAula === data);
    const escala = db.escalas.find((e) => e.classeId === classe.id && e.dataDomingo === data);
    const matriculados = db.membros.filter((m) => m.classeId === classe.id && m.ativo && m.tipoMembro === 'MEMBRO').length;
    let presentes = 0, membrosPresentes = 0, biblias = 0, revistas = 0, visitantes = 0, oferta = 0;
    if (aula) {
      t.iniciadas++;
      if (aula.status === 'CONCLUIDA') t.concluidas++;
      for (const c of db.chamadas.filter((x) => x.aulaId === aula.id)) {
        if (c.presente) {
          presentes++;
          if (db.membros.find((m) => m.id === c.membroId)?.tipoMembro === 'VISITANTE') visitantes++;
          else membrosPresentes++;
        }
        if (c.trouxeBiblia) biblias++;
        if (c.trouxeRevista) revistas++;
      }
      oferta = aula.valorOferta ?? 0;
    }
    t.matriculados += matriculados;
    t.presentes += presentes;
    t.membrosPresentes += membrosPresentes;
    t.biblias += biblias;
    t.revistas += revistas;
    t.visitantes += visitantes;
    t.ofertas += oferta;
    return {
      classeId: classe.id,
      classeNome: classe.nome,
      professorEscalado: escala ? db.usuarios.find((u) => u.id === escala.professorId)?.nome ?? null : null,
      aulaId: aula?.id ?? null,
      status: aula?.status ?? null,
      numeroLicao: aula?.numeroLicao ?? null,
      temaLicao: aula?.temaLicao ?? null,
      matriculados,
      presentes,
      ausentes: Math.max(0, matriculados - membrosPresentes),
      frequencia: percentual(membrosPresentes, matriculados),
      biblias,
      revistas,
      visitantes,
      oferta,
    };
  });

  return {
    dataDomingo: data,
    totalClasses: classes.length,
    aulasIniciadas: t.iniciadas,
    aulasConcluidas: t.concluidas,
    matriculados: t.matriculados,
    presentes: t.presentes,
    ausentes: Math.max(0, t.matriculados - t.membrosPresentes),
    frequencia: percentual(t.membrosPresentes, t.matriculados),
    biblias: t.biblias,
    revistas: t.revistas,
    visitantes: t.visitantes,
    totalOfertas: Math.round(t.ofertas * 100) / 100,
    classes: linhas,
  };
});

// ---------- Adapter do Axios ----------

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function lerToken(config: InternalAxiosRequestConfig): string | null {
  const h = config.headers?.get?.('Authorization') ?? config.headers?.Authorization;
  const valor = typeof h === 'string' ? h : null;
  return valor?.startsWith('Bearer ') ? valor.slice(7) : null;
}

function resposta(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { data, status, statusText: String(status), headers: {}, config, request: {} };
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await esperar(120 + Math.random() * 230);
  const db = carregar();
  const metodo = (config.method ?? 'get').toLowerCase();
  const caminho = (config.url ?? '').split('?')[0];
  const query: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(config.params ?? {})) if (v != null) query[k] = String(v);

  const falhar = (status: number, message: string) => {
    const res = resposta(config, status, { message, status, timestamp: agora() });
    throw new AxiosError(message, status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, null, res);
  };

  let encontrada: Rota | undefined;
  let params: Record<string, string> = {};
  for (const r of rotas) {
    if (r.metodo !== metodo) continue;
    const m = r.padrao.exec(caminho);
    if (!m) continue;
    encontrada = r;
    params = Object.fromEntries(r.chaves.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    break;
  }
  if (!encontrada) return falhar(404, 'Recurso não encontrado');

  const tk = lerToken(config);
  const eu = tk?.startsWith('mock.') ? db.usuarios.find((u) => u.id === tk.slice(5)) ?? null : null;
  if (encontrada.acesso !== 'publico') {
    if (!eu) return falhar(401, 'Sessão expirada. Entre novamente.');
    if (encontrada.acesso === 'super' && eu.papel !== 'SUPERINTENDENTE') return falhar(403, 'Você não tem permissão para esta ação.');
    if (encontrada.acesso === 'equipe' && eu.papel === 'ALUNO') return falhar(403, 'Você não tem permissão para esta ação.');
  }

  let body: unknown = config.data;
  if (typeof body === 'string' && body) {
    try {
      body = JSON.parse(body);
    } catch {
      /* corpo não-JSON */
    }
  }

  try {
    const resultado = encontrada.handler(db, { metodo, params, query, body, eu });
    persistir();
    if (resultado === undefined || resultado === null) return resposta(config, 204, '');
    return resposta(config, metodo === 'post' && /\/(usuarios|classes|membros|planos-licoes)$/.test(caminho) ? 201 : 200, structuredClone(resultado));
  } catch (e) {
    if (e instanceof HttpErro) return falhar(e.status, e.message);
    console.error('[mock]', e);
    return falhar(500, 'Erro inesperado no servidor de demonstração');
  }
};
