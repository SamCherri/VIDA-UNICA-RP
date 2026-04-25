# Auditoria Inicial — VIDA ÚNICA RP

## 1) Objetivo do projeto

O **VIDA ÚNICA RP** é um jogo web mobile-first de roleplay textual hardcore por **cenas visuais em locais da cidade**, com ações contextuais por botões e consequências persistentes.

Princípios centrais preservados:

- Conta não morre.
- Personagem pode morrer permanentemente.
- Personagem morto vai para histórico e não volta.
- Apenas um personagem vivo por conta.
- Cena por local como linha do tempo narrativa.
- NPC fallback como suporte para não travar o jogo (sem substituir jogadores).

---

## 2) Estado atual da branch

A branch está com uma base técnica funcional de MVP inicial:

- Monorepo com `apps/web`, `apps/api`, `packages/shared`, `prisma`.
- Frontend React + Vite + TypeScript, mobile-first e menu por seções.
- Backend Fastify + TypeScript + Prisma.
- Banco PostgreSQL com migration inicial versionada em `prisma/migrations`.
- Autenticação com hash de senha e token.
- Fluxo de personagem vivo/morto + histórico.
- Locais da cidade, entrada/saída de local, fala e ações contextuais.
- Logs de ações e logs administrativos.
- Painel admin básico com papéis e permissões.
- Endpoint de NPC fallback com controle de solicitação e proteção anti-spam.

---

## 3) O que foi reaproveitado

Foi reaproveitado integralmente o que já estava correto para o VIDA ÚNICA RP:

- Estrutura de monorepo e scripts de build/dev.
- Stack principal (React/Vite/TS, Fastify/TS, Prisma/PostgreSQL).
- Base de domínio do jogo por cena/local.
- Regras centrais de conta/personagem/morte permanente.
- Seeds de locais iniciais e ações básicas.
- Preparação para Railway via variáveis de ambiente.

---

## 4) O que foi descartado e por quê

Foi descartado apenas o conteúdo conceitualmente incorreto que contaminava o projeto:

- Documento de auditoria anterior com nome e contexto de outro projeto.
- Referências que não pertenciam ao escopo narrativo urbano do VIDA ÚNICA RP.

Motivo: esses pontos não pertencem ao escopo do VIDA ÚNICA RP e podem gerar decisões arquiteturais erradas.

---

## 5) Arquitetura atual (visão prática)

### Apresentação (Frontend)

- Aplicação web mobile-first.
- Telas para login/cadastro, personagem, cidade, cena e ações por botão.
- Consome API sem conter regra crítica de domínio.

### Aplicação (Backend)

- Rotas de autenticação, personagem, locais/cena, admin e NPC fallback.
- Validação de entrada e tratamento de erros com respostas amigáveis.
- Controle de permissões por papéis administrativos.

### Infraestrutura

- Prisma Client para persistência.
- Migration SQL versionada.
- Seed inicial para locais e ações.

### Domínio (regras essenciais já aplicadas)

- Vida única por personagem.
- Histórico de personagens mortos.
- Restrição de um personagem vivo por conta.
- Logs para ações relevantes e administrativas.

---

## 6) Próximos passos recomendados

1. Adicionar testes automatizados para fluxos críticos:
   - criação de personagem;
   - morte permanente;
   - bloqueios por role;
   - cooldown anti-spam.
2. Evoluir realtime para sincronização de cena (SSE/WebSocket).
3. Refinar ações contextuais por local e estado do personagem.
4. Fortalecer trilha de auditoria (filtros, paginação e retenção de logs).
5. Organizar camadas com mais módulos internos (domínio/aplicação/infra/presentação) conforme crescimento.

---

## 7) Riscos técnicos atuais

- **Sem suíte de testes automatizados**: maior risco de regressão em mudanças futuras.
- **Cooldown em memória**: funciona para MVP, mas em múltiplas instâncias precisa de armazenamento centralizado.
- **Escopo administrativo em expansão**: tende a exigir políticas mais granulares ao crescer.

---

## 8) Preparação para Railway

Status atual de preparo:

- Projeto já opera com variáveis de ambiente no serviço (sem depender de `.env` em produção).
- `prisma:deploy` depende de `prisma/migrations` versionado (já presente).
- Variáveis mínimas recomendadas:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `WEB_ORIGIN`
  - `VITE_API_URL`

Fluxo recomendado de deploy:

1. Validar build e Prisma localmente.
2. Mesclar branch corrigida na `main`.
3. Rodar `prisma:deploy` no serviço de API.
4. Rodar `prisma:seed` quando necessário.
5. Publicar frontend apontando `VITE_API_URL` para a API.

---

## 9) Suporte futuro a multiplayer

A base atual já permite evolução para multiplayer com:

- Cena por local estruturada em persistência.
- Eventos de ação e mensagens por contexto de local.
- Logs e regras de autorização centralizadas no backend.

Próximo salto técnico será adicionar camada realtime robusta para sincronização imediata entre clientes.

---

## 10) Preservação da identidade de jogo por cenas

A identidade do VIDA ÚNICA RP está preservada nesta branch:

- navegação por cidade/local/cena;
- interação narrativa por local;
- ações contextuais por botão;
- consequências de vida única;
- suporte administrativo e institucional sem descaracterizar o jogo.

Este documento substitui integralmente qualquer auditoria com contexto externo ao VIDA ÚNICA RP.
