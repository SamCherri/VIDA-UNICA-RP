# VIDA ÚNICA RP

Jogo/simulador de vida RP **mobile-first**, instalável no celular como **PWA**, com cidade viva, profissões, rotina, decisões e consequências.

## Direção de produto

O VIDA ÚNICA RP não tenta competir com jogos 2D/3D por gráfico.
Ele compete por profundidade social, rotina, profissões, consequências, presença de jogadores e cidade viva.

- O jogador não apenas conversa: ele vive uma rotina dentro da cidade.
- Profissões pequenas importam.
- Cada ação pode deixar rastro.
- NPCs existem para evitar travamento, mas quem move a cidade são os jogadores.

## Instalação no celular

O jogo roda como PWA.

No Android (Chrome):
1. Abra a URL publicada do jogo.
2. Toque em **⋮**.
3. Escolha **Adicionar à tela inicial** ou **Instalar app**.
4. Abra pelo ícone para jogar em tela cheia, com aparência de jogo mobile.

Futuramente, o projeto pode ser empacotado como APK.

## Identidade de jogo mobile

O projeto deve parecer jogo instalado:

- tela cheia;
- ícone próprio;
- menu inferior;
- botões grandes;
- tema urbano escuro;
- experiência vertical/mobile-first.

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
- `POST /characters/me/profession`

### Locations
- `GET /locations`
- `GET /locations/:id`
- `POST /locations/:id/enter`
- `POST /locations/:id/leave`

### Scene
- `GET /locations/:id/messages`
- `GET /locations/:id/presence`
- `GET /locations/:id/available-actions`
- `POST /locations/:id/say`
- `POST /locations/:id/action`
- `POST /locations/:id/professional-action`

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

## Profissões iniciais e fluxos institucionais (fase atual)

Profissões aceitas no MVP desta fase:
- `Desempregado` (fallback padrão quando não houver profissão definida)
- `Atendente do Hospital`
- `Caixa de Banco`
- `Segurança`
- `Policial`

Locais com ações profissionais:
- **Hospital** (Atendente do Hospital)
- **Banco Central** (Caixa de Banco e Segurança)
- **Delegacia** (Policial)
- **Praça Central** (Policial)
- **Beco Industrial** (Policial)

Limitações desta fase:
- Troca de profissão é livre para testes (sem processo seletivo ou aprovação).
- Ação profissional só gera mensagem narrativa na cena + log de auditoria.
- Sem efeitos econômicos, inventário, salários, XP, hierarquia ou sistema jurídico completo.

Próximos passos recomendados:
1. Fluxo de ingresso/aprovação por profissão.
2. Efeitos institucionais progressivos (chamados, protocolos, filas).
3. Integração futura com economia e progressão de carreira.

## Próximas fases

1. UX de simulador de vida e tela "Agora/Local".
2. PWA instalável e identidade de jogo mobile.
3. Rotina/trabalho e progressão institucional.
4. Protocolos institucionais.
5. Economia, inventário e empresas.
6. Propriedades e veículos.
7. Regras avançadas de risco, ferimentos e morte.

## Validação rápida de build (pré-merge)

Antes de abrir/mesclar PR, execute:

```bash
npm run build -w @vida-unica/web
npm run build -w @vida-unica/api
```
