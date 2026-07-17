# Deploy: Vercel + Render + Prisma

Arquitetura escolhida:

```text
Vercel
  apps/web  -> Next.js frontend

Render
  apps/api  -> Fastify API
  Postgres  -> banco relacional gerenciado

Prisma
  schema.prisma
  migrate deploy em produção
```

## 1. Subir o repositório

Envie o monorepo para GitHub, GitLab ou Bitbucket. O Render e a Vercel vão ler o mesmo repositório.

## 2. Deploy da API e Postgres no Render

### Opção recomendada: Blueprint

No Render:

1. Vá em **New > Blueprint**.
2. Conecte o repositório.
3. O Render detecta o arquivo `render.yaml` na raiz.
4. Confirme a criação de:
   - `pluxsales-postgres`
   - `pluxsales-api`
5. Quando o Render pedir `CORS_ORIGIN`, informe temporariamente:

```text
https://*.vercel.app,http://localhost:3000
```

Depois do deploy final da Vercel, troque para:

```text
https://SEU-PROJETO.vercel.app,https://*.vercel.app
```

O Blueprint faz:

- Criação do Postgres.
- Injeção de `DATABASE_URL` na API usando o banco do Render.
- Build da API.
- `prisma migrate deploy` antes de iniciar o serviço.
- Seed inicial com ingredientes, produtos e classificações fiscais.
- Health check em `/health`.

### Opção manual

Crie primeiro um Render Postgres e copie a **Internal Database URL**.

Depois crie um Web Service para a API:

```text
Root Directory: .
Runtime: Node
Build Command:
corepack enable && corepack prepare pnpm@11.7.0 --activate && pnpm install --frozen-lockfile --prod=false && pnpm render:build

Pre-Deploy Command:
corepack enable && corepack prepare pnpm@11.7.0 --activate && pnpm db:deploy

Start Command:
corepack enable && corepack prepare pnpm@11.7.0 --activate && pnpm render:start
```

Variáveis:

```text
NODE_ENV=production
NODE_VERSION=22
DATABASE_URL=<Internal Database URL do Render Postgres>
CORS_ORIGIN=https://SEU-PROJETO.vercel.app,https://*.vercel.app
```

Seed inicial, se fizer manualmente:

```bash
pnpm db:seed
```

Rode isso no shell do Render apenas na primeira carga, porque o seed recria os produtos demonstrativos.

## 3. Deploy do frontend na Vercel

Na Vercel:

1. Importe o mesmo repositório.
2. Selecione o projeto frontend.
3. Configure:

```text
Framework Preset: Next.js
Root Directory: apps/web
```

O arquivo `apps/web/vercel.json` já define:

```text
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm vercel:build
```

Variável de ambiente:

```text
NEXT_PUBLIC_API_URL=https://pluxsales-api.onrender.com
```

Troque `pluxsales-api.onrender.com` pelo domínio real exibido no Render.

## 4. Trabalhar local usando banco em nuvem

Você não precisa de Docker. Para desenvolver local apontando para Render Postgres:

1. Copie a **External Database URL** do Render Postgres.
2. Ajuste `apps/api/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/pluxsales?sslmode=require"
API_PORT=3333
CORS_ORIGIN="http://localhost:3000"
```

3. Rode:

```bash
pnpm db:generate
pnpm db:deploy
pnpm --filter @pluxsales/api dev
pnpm --filter @pluxsales/web dev
```

Para mudanças de schema durante desenvolvimento, prefira um banco de desenvolvimento separado. Evite rodar `prisma migrate dev` direto no banco de produção.

## 5. Ordem ideal de produção

1. Deploy Render Blueprint.
2. Copiar URL pública da API.
3. Deploy Vercel com `NEXT_PUBLIC_API_URL`.
4. Atualizar `CORS_ORIGIN` no Render com o domínio final da Vercel.
5. Testar:

```text
https://SUA-API.onrender.com/health
https://SEU-PROJETO.vercel.app
```

## 6. Checklist antes do deploy

Rode localmente:

```bash
pnpm db:generate
pnpm --filter @pluxsales/api exec prisma validate
pnpm typecheck
pnpm build
```

Confirme que existe ao menos uma pasta em:

```text
apps/api/prisma/migrations
```

Sem migration versionada, o comando `prisma migrate deploy` não cria as tabelas no Render Postgres.
