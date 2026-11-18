# Levva

Plataforma de transporte executivo (Belo Horizonte). Multi-empresa (multi-tenant) desde o início,
mas no MVP opera com uma única empresa: a do próprio dono da plataforma.

Plano completo: https://claude.ai/artifact/PeRViETx6E4V9FDPqqaUmF

## Estrutura

- `apps/api` — backend NestJS + Prisma + PostgreSQL/PostGIS
- `apps/web` — painel Next.js (Admin Master e Gestor)
- `apps/mobile` — app Expo (Cliente e Motorista)
- `packages/shared` — tipos e regras de negócio compartilhadas (ex.: calculadora de preço)

## Regras obrigatórias

- TypeScript em tudo. Textos de interface em português do Brasil.
- **Isolamento entre empresas:** toda tabela de operação tem `tenantId`. Toda consulta filtra pelo
  `tenantId` do usuário autenticado (vem do token, nunca do corpo da requisição). Toda rota nova
  precisa de teste que prove que um gestor não lê dados de outro.
- Perfis: `ADMIN_MASTER`, `GESTOR`, `MOTORISTA`, `CLIENTE`. Admin Master vê totais e comissão,
  não a carteira de clientes de cada gestor.
- **Dinheiro em centavos (inteiros)**, nunca float. Toda regra de dinheiro tem teste automático.
- Divisão padrão da corrida: gestor 15%, plataforma 7% (só registrada no MVP), motorista o restante.
  Os carros são dos motoristas; blindados são alugados de locadoras.
- Pagamento no MVP: só Pix (Copia e Cola / QR gerado pela API, sem gateway), baixa manual pelo gestor.
- Segredos só em variáveis de ambiente (`.env`, nunca commitado). Ver `.env.example`.
- Design: usar o skill Impeccable (`/impeccable`). Ler `PRODUCT.md` e `DESIGN.md` antes de mexer em UI.

## Comandos

- `docker compose up -d` — sobe o PostgreSQL local
- `pnpm preparar` — cria os .env, instala, gera o Prisma, aplica migrações e cria usuários de teste
- `pnpm dev` — API (porta 3333) e painel (porta 3000) juntos
- `pnpm test` — testes de todos os pacotes (a API usa o banco `levva_test`)
