# PluxSales

MVP web para food service com engenharia de cardápio, cadastro de ingredientes, produtos compostos, CMV e classificação fiscal por linha.

## Stack

- Monorepo com `pnpm`
- Frontend: Next.js App Router, TypeScript, CSS Modules, React Hook Form e Zod
- Backend: Node.js, Fastify, TypeScript, Zod, Prisma ORM e PostgreSQL
- Banco local: PostgreSQL via Docker Compose

## Ideia fiscal do MVP

O PluxSales separa o produto vendido em:

1. Ingredientes, cada um com NCM, PIS CST, COFINS CST, ICMS CST/CSOSN opcional, `cstIbsCbs` e `cClassTrib`.
2. Produto final, com perfil fiscal conservador para food service.
3. Taxa de preparo fixa, por padrão R$ 5,00, com classificação própria.

O cenário padrão do seed é `SPLIT_INGREDIENTS_PREPARATION_FEE`: a base da venda é simulada como ingredientes classificados individualmente + taxa técnica de preparo. O sistema marca o cenário como `requiresLegalReview`, porque a adoção em documento fiscal real precisa de validação de contador e jurídico.

## Fonte da tabela IBS/CBS

O seed usa uma seleção da tabela oficial `CST-IBS/CBS` e `cClassTrib` publicada no portal nacional da NF-e:

- Fonte: Portal NF-e, área "Documentos Diversos"
- Arquivo: `Tabela cClassTrib e CST IBS/CBS`
- Publicação listada: 23/06/2026
- Referência técnica listada: IT 2025.002 v1.60

Classes internas carregadas no seed:

| CST | cClassTrib | Nome | Red. IBS | Red. CBS |
| --- | --- | --- | ---: | ---: |
| 000 | 000001 | Tributação integral | 0% | 0% |
| 200 | 200003 | Vendas de produtos destinados à alimentação humana (Anexo I) | 100% | 100% |
| 200 | 200014 | Hortícolas, frutas e ovos (Anexo XV) | 100% | 100% |
| 200 | 200034 | Alimentos destinados ao consumo humano (Anexo VII) | 60% | 60% |
| 200 | 200047 | Bares e Restaurantes | 40% | 40% |
| 410 | 410019 | Exclusão da gorjeta na base de cálculo | 0% | 0% |

## Estrutura

```text
pluxsales/
  apps/
    api/
      prisma/
      src/
    web/
      src/
```

## Arquitetura de deploy definida

O caminho principal do projeto agora é:

- Frontend Next.js em Vercel, usando `apps/web`.
- API Fastify em Render, usando `apps/api`.
- PostgreSQL gerenciado no Render.
- Prisma Migrate rodando no pre-deploy da API.

Veja o passo a passo completo em [`docs/deploy-vercel-render.md`](docs/deploy-vercel-render.md).

## Rodando localmente

Instale dependências:

```bash
pnpm install
```

Suba o PostgreSQL:

```bash
docker compose up -d
```

Crie os arquivos de ambiente:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Gere o Prisma Client e rode a migration:

```bash
pnpm db:generate
pnpm db:migrate
```

Carregue os dados iniciais:

```bash
pnpm db:seed
```

Inicie API e web:

```bash
pnpm dev
```

URLs locais:

- Web: `http://localhost:3000`
- API: `http://localhost:3333`
- Health: `http://localhost:3333/health`

## Rotas da API

```text
GET    /health

GET    /ingredients
POST   /ingredients
PATCH  /ingredients/:id
DELETE /ingredients/:id

GET    /products
POST   /products/create-full

GET    /tax-classifications
```

## Validações principais

- Custo e estoque não podem ser negativos.
- Quantidade usada no produto deve ser maior que zero.
- Produto precisa de ao menos um ingrediente.
- Backend recalcula CMV e simulação fiscal na transação.
- Produto em estratégia split não aceita taxa de preparo maior que o preço de venda.
- Classificação tributária é selecionada a partir do catálogo interno versionado.

## Deploy em produção

Use:

- `render.yaml` para criar API + Postgres no Render.
- `apps/web/vercel.json` para o build do frontend na Vercel.
- `docs/deploy-vercel-render.md` para a ordem exata de publicação.

## Próximos módulos naturais

- Catálogo completo importável da planilha oficial `cClassTrib`.
- Regras estaduais de ICMS por UF.
- Perfis fiscais aprovados com trilha de usuário, data e parecer.
- Emissão fiscal em ambiente homologação.
- Estoque com baixa automática por venda.
- PDV com split fiscal por item.
