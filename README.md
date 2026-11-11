# EBD Gestão

Sistema web (mobile-first) para gestão de Escola Bíblica Dominical: chamada dominical com Optimistic UI,
escala de professores, relatório consolidado e cadastros.

```
backend/   API REST — Java 17+ · Spring Boot 3.3 · Spring Security + JWT · JPA · Flyway · PostgreSQL/H2
frontend/  SPA — React 18 · Vite · TypeScript · Tailwind · Radix UI (padrão shadcn/ui) · TanStack Query · Sonner · Lucide
```

## Como rodar (desenvolvimento)

Pré-requisitos: **JDK 17+**, **Maven 3.9+**, **Node 18+**.

### 1. Backend (porta 8080)

```bash
cd backend
mvn spring-boot:run
```

O perfil `dev` (padrão) usa H2 em arquivo (`backend/data/`), então os dados persistem entre reinícios.
As tabelas são criadas pelo Flyway (`src/main/resources/db/migration`).

### 2. Frontend (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

O Vite faz proxy de `/api` para `http://localhost:8080`. Acesse `http://localhost:5173` — também pelo celular
na mesma rede (use o IP da máquina, ex.: `http://192.168.0.10:5173`).

### Primeiro acesso

1. Na tela inicial, aba **Cadastrar-se**, crie uma conta com o papel **Superintendente**.
2. Em **Cadastros**, cadastre professores, classes (com o titular), alunos e as lições do trimestre.
3. Professores entram e caem direto na **Chamada**.

## Produção (PostgreSQL)

```bash
docker compose up -d          # sobe um PostgreSQL local (opcional)

cd backend
mvn clean package
SPRING_PROFILES_ACTIVE=prod \
DATABASE_URL=jdbc:postgresql://localhost:5432/ebd_gestao \
DATABASE_USERNAME=postgres DATABASE_PASSWORD=postgres \
JWT_SECRET="uma-chave-aleatoria-com-pelo-menos-32-caracteres" \
CORS_ORIGINS=https://seu-dominio.com \
java -jar target/ebd-gestao-api-1.0.0.jar

cd ../frontend
VITE_API_URL=https://api.seu-dominio.com/api npm run build   # gera frontend/dist
```

| Variável | Descrição | Padrão |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` (H2) ou `prod` (PostgreSQL) | `dev` |
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Conexão PostgreSQL | localhost |
| `JWT_SECRET` | Chave HMAC do JWT (≥ 32 caracteres) | chave de dev — **troque** |
| `JWT_EXPIRATION_HOURS` | Validade do token | `12` |
| `CORS_ORIGINS` | Origens permitidas (separadas por vírgula) | `http://localhost:5173` |
| `VITE_API_URL` | URL base da API no build do frontend | `/api` |

## Permissões

| Recurso | Superintendente | Professor |
|---|---|---|
| Chamada, aulas, oferta | ✅ | ✅ |
| Ler classes, alunos, lições, escala | ✅ | ✅ |
| Cadastrar aluno/visitante rápido na chamada | ✅ | ✅ |
| Editar/excluir cadastros, usuários, escala, relatórios | ✅ | ❌ |

## Regras de negócio da chamada

- Marcar **Bíblia** ou **Revista** marca **Presente** automaticamente.
- Desmarcar **Presente** desmarca **Bíblia** e **Revista**.
- As regras rodam no front (Optimistic UI, com fila de gravação por aluno) **e** no backend.
- **Matriculados** = alunos ativos do tipo *Membro*. **Frequência** = membros presentes ÷ matriculados.
  **Visitantes** contam como presentes, mas não entram no cálculo de frequência.
