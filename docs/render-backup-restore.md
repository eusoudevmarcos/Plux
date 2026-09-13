# Backup e restore do PostgreSQL Render

Este runbook define o mínimo operacional para a beta da Plux.

## Rotina recomendada

1. Ativar backups automáticos do banco `pluxsales-postgres` no painel do Render.
2. Antes de cada deploy com migration, criar um backup manual pelo Render.
3. Registrar no checklist interno: data, responsável, commit implantado e status do backup.
4. Testar restore em banco separado antes de restaurar produção.

## Backup manual via terminal

Use a `DATABASE_URL` externa do Render em uma máquina confiável:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file=plux-$(date +%Y%m%d-%H%M).dump
```

No Windows PowerShell:

```powershell
pg_dump $env:DATABASE_URL --format=custom --no-owner --no-acl --file "plux-$(Get-Date -Format yyyyMMdd-HHmm).dump"
```

## Restore em banco de validação

Crie um banco novo no Render ou localmente e restaure nele primeiro:

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$RESTORE_DATABASE_URL" plux-YYYYMMDD-HHMM.dump
```

Depois rode:

```bash
pnpm db:status
pnpm --filter @pluxsales/api prisma:generate
pnpm typecheck
```

## Restore em produção

1. Colocar API em manutenção ou pausar deploys.
2. Confirmar que o backup escolhido foi testado em banco de validação.
3. Restaurar com `pg_restore` usando a URL de produção.
4. Rodar `pnpm db:status`.
5. Subir a API e validar `/health`, login, lojas, caixa, compras e fiscal.

## Ponto de atenção

Nunca commitar `DATABASE_URL`, dumps ou certificados fiscais no Git. Esses arquivos ficam fora do repositório e devem ser protegidos por controle de acesso.
