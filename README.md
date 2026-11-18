# Levva — Transporte Executivo

Plataforma de gestão de transporte executivo: cotação com calculadora de preço, designação de motoristas,
rastreio e cobrança por Pix.

| Pasta | O que é |
| --- | --- |
| `apps/api` | API (NestJS + Prisma + PostgreSQL) |
| `apps/web` | Painel web do gestor (Next.js) |
| `packages/shared` | Regras compartilhadas: calculadora de preço, Pix Copia e Cola, ciclo da corrida |

## Rodar no seu computador

### 1. Instale uma vez

- [Node.js 20 ou mais novo](https://nodejs.org) (versão LTS)
- pnpm: depois de instalar o Node, rode `corepack enable` no terminal
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), para o banco de dados
  (ou um PostgreSQL 16 instalado direto, com usuário `levva`, senha `levva` e os bancos `levva` e `levva_test`)
- [Git](https://git-scm.com)

### 2. Baixe e prepare o projeto

```bash
git clone https://github.com/theuz013/levva.git
cd levva
docker compose up -d
pnpm preparar
```

`pnpm preparar` cria os arquivos `.env` a partir dos modelos, instala as dependências, cria as tabelas
e os usuários de teste. Antes de rodar, se quiser, troque `SEED_SENHA` em `apps/api/.env`
(se o arquivo ainda não existir, rode `pnpm preparar` uma vez, edite e rode de novo).

### 3. Suba a API e o painel

```bash
pnpm dev
```

- Painel: http://localhost:3000
- API: http://localhost:3333/saude deve responder `{"ok":true}`

Entre com `gestor@levva.local` e a senha definida em `SEED_SENHA`
(o padrão do modelo é `troque-esta-senha`). Também existe `admin@levva.local` (Admin Master).

### Rodar os testes

```bash
pnpm test
```

Os testes da API usam o banco `levva_test`, que é apagado e recriado a cada execução; o banco de
desenvolvimento nunca é tocado.

## Problemas comuns

- **Porta 5432 ocupada:** já existe um PostgreSQL rodando na máquina. Pare-o ou use ele mesmo
  (ajuste `DATABASE_URL` e `TEST_DATABASE_URL` em `apps/api/.env`).
- **Login dá "Não foi possível falar com o servidor":** a API não está rodando ou o banco está parado
  (`docker compose up -d`).
- **Erro do Prisma "Cannot find module .prisma/client":** rode `pnpm preparar` de novo.

## Estado atual

A tela de cotações usa **dados de exemplo**; a ligação com as corridas reais da API é o próximo passo.
Plano completo do produto: ver `CLAUDE.md`.
