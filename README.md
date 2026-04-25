# VIDA ÚNICA RP

Web app **mobile-first** de roleplay hardcore por cenas visuais, com vida única por personagem, ações contextuais por botão e backend preparado para PostgreSQL/Prisma em Railway.

## Objetivo do MVP

Esta entrega cria a base técnica inicial com:

- Monorepo (`apps/web`, `apps/api`, `packages/shared`, `prisma`)
- Cadastro/login com senha com hash + JWT
- Personagem com estado vivo/morto e histórico
- Cidade com locais iniciais
- Cena por local como linha do tempo narrativa
- Ações básicas por botão com logs
- Painel admin básico com proteção por role
- Evento de NPC fallback básico

## Stack

### Frontend
- React
- Vite
- TypeScript
- UI mobile-first (tema escuro, cards, botões grandes, menu inferior fixo)

### Backend
- Node.js
- TypeScript
- Fastify
- Prisma
- PostgreSQL
- API REST

### Infraestrutura
- Railway (serviços separados: web, api, postgres)

## Estrutura de pastas

```text
apps/
  web/
  api/
packages/
  shared/
prisma/
  schema.prisma
  seed.ts
docs/
  vida-unica-rp-spec.txt
README.md
package.json
.gitignore
```

## Instalação

```bash
npm install
```

## Variáveis de ambiente


## Status de branch antes do deploy

- A branch de correções precisa ser **mesclada na `main`** antes de qualquer deploy no Railway.
- O fluxo recomendado é: validar build + migrations nesta branch corrigida -> merge para `main` -> deploy.


> Em produção (Railway), configure direto no painel do serviço.

### API (`apps/api`)

- `DATABASE_URL`
- `JWT_SECRET`
- `WEB_ORIGIN`
- `PORT` (opcional, padrão 3333)
- `ADMIN_EMAIL` (opcional para seed)
- `ADMIN_PASSWORD` (opcional para seed)

> Variáveis mínimas de produção no Railway: `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` e `VITE_API_URL`.

### Web (`apps/web`)

- `VITE_API_URL`

## Banco de dados (Prisma)

Gerar client:

```bash
npm run prisma:generate
```

Criar migração local:

```bash
npm run prisma:migrate -- --name init
```

Aplicar migrações em produção (depende da pasta `prisma/migrations` versionada no repositório):

```bash
npm run prisma:deploy
```

Popular dados iniciais:

```bash
npm run prisma:seed
```

## Rodar localmente

Rodar API e Web juntos:

```bash
npm run dev
```

Rodar separado:

```bash
npm run dev:api
npm run dev:web
```

## Endpoints principais

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Characters
- `POST /characters`
- `GET /characters/me`
- `GET /characters/history`
- `POST /characters/:id/mark-dead`

### Locations
- `GET /locations`
- `GET /locations/:id`
- `POST /locations/:id/enter`
- `POST /locations/:id/leave`

### Scene
- `GET /locations/:id/messages`
- `POST /locations/:id/say`
- `POST /locations/:id/action`

### Admin
- `GET /admin/users`
- `GET /admin/characters`
- `GET /admin/logs`
- `POST /admin/users/:id/ban`
- `POST /admin/characters/:id/freeze`

### Game
- `POST /game/npc-fallback`

## Railway (deploy)

1. Criar serviço `postgres`.
2. Criar serviço `api` apontando para este repositório.
3. Configurar no serviço `api`: `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
4. Executar `npm run prisma:deploy` e `npm run prisma:seed` no serviço `api`.
5. Criar serviço `web` apontando para este repositório.
6. Configurar no serviço `web`: `VITE_API_URL` apontando para URL pública da API.

## Regras implementadas nesta fase

- Conta não morre; personagem morre.
- Personagem morto não pode ser usado novamente.
- Morte permanente zera saldo e move para histórico.
- Ações importantes geram `action_logs`.
- Ações administrativas geram `admin_logs`.
- Sem comando textual `/me`, `/diz`, `/grita` como mecânica base.
- Ações por botões + caixa de fala simples.

## Próximas fases

1. Realtime (SSE/WebSocket) para cena em tempo real.
2. Sistema de profissões e fluxos institucionais (polícia, hospital, prefeitura).
3. Economia avançada (empresas, empregos, inventário).
4. Regras de combate/ferimentos/morte com simulação de risco.
5. Evolução do painel admin e trilha de auditoria completa.
