# Auditoria Inicial — TeleSoccer (VIDA ÚNICA RP)

## 1. Objetivo desta auditoria

Mapear o estado atual do repositório e propor um plano incremental para evoluir o projeto para um web app mobile-first de futebol por turnos, baseado em cenas visuais, com arquitetura limpa e preparado para PostgreSQL, Prisma e deploy no Railway.

## 2. Estado atual do repositório

### 2.1 Estrutura encontrada

- `README.md`
- `docs/vida-unica-rp-spec.txt`

### 2.2 Diagnóstico

- Não há estrutura de aplicações (`apps/web`, `apps/api`) ainda.
- Não há camada de domínio, aplicação, infraestrutura e apresentação implementadas.
- Não há setup de Prisma/PostgreSQL nem contratos de API.
- A especificação funcional está bem definida no documento principal e deve ser tratada como fonte de verdade inicial.

## 3. Reaproveitamento da base existente

A base atual reaproveitável é:

1. Direcionamento de produto e UX mobile-first do `vida-unica-rp-spec.txt`.
2. Regras de consequência, risco e centralidade da cena como princípio de modelagem de domínio.
3. Diretrizes de stack (React/Vite/TS; Node/TS; Prisma/PostgreSQL; Railway).

## 4. Lacunas críticas para começar corretamente

1. Falta de monorepo estruturado por responsabilidade.
2. Ausência de contratos de domínio para partidas por turno e cenas.
3. Ausência de casos de uso da aplicação (orquestração sem regra no frontend).
4. Ausência de infraestrutura de persistência e migrações.
5. Ausência de estratégia de tempo real para atualizações de cena/turno.

## 5. Proposta de arquitetura (alvo)

## 5.1 Estrutura de pastas sugerida

```text
apps/
  web/
    src/
      presentation/
        scenes/
        components/
        state/
      infrastructure/
        api/
        realtime/
  api/
    src/
      domain/
        entities/
        value-objects/
        services/
        events/
      application/
        use-cases/
        dto/
        ports/
      infrastructure/
        db/
          prisma/
          repositories/
        http/
          controllers/
          routes/
        realtime/
      presentation/
        serializers/
packages/
  shared/
    src/
      contracts/
      schemas/
      types/
prisma/
  schema.prisma
  migrations/
docs/
```

## 5.2 Separação de camadas

- **Domínio:** regras de negócio puras (turnos, cenas, ação, risco, energia, consequências).
- **Aplicação:** casos de uso e orquestração (`IniciarCena`, `ExecutarAcao`, `EncerrarTurno`, etc).
- **Infraestrutura:** Prisma, repositórios, transporte HTTP, realtime.
- **Apresentação:** UI mobile-first, navegação por cenas, componentes visuais e estado de tela.

## 6. Modelo inicial de domínio (futebol por turnos em cenas)

Entidades iniciais:

- `PlayerProfile`
- `Match`
- `Scene`
- `Turn`
- `Action`
- `Consequence`

Value Objects iniciais:

- `RiskLevel` (LOW, MEDIUM, HIGH, EXTREME)
- `Stamina`
- `Pressure`
- `FieldZone`
- `ClockMinute`

Eventos de domínio iniciais:

- `TurnStarted`
- `ActionCommitted`
- `ConsequenceApplied`
- `SceneAdvanced`
- `MatchFinished`

## 7. Estratégia de implementação incremental

### Fase 0 — Fundação técnica

- Criar estrutura de monorepo.
- Configurar TypeScript, lint e scripts.
- Preparar `prisma/schema.prisma` para PostgreSQL (Railway).

### Fase 1 — Núcleo de domínio

- Implementar entidades e value objects mínimos.
- Criar casos de uso principais sem acoplamento HTTP.
- Cobrir regras críticas com testes unitários.

### Fase 2 — API e persistência

- Implementar API (`/matches`, `/scenes`, `/turns`, `/actions`).
- Integrar Prisma e repositórios concretos.
- Introduzir logs de ações relevantes.

### Fase 3 — Frontend mobile-first por cenas

- Layout base com menu inferior e cards.
- Fluxo de cena e ações por botão.
- Consumo dos casos via API, sem regra de negócio no frontend.

### Fase 4 — Tempo real e multiplayer futuro

- Publicação de eventos de partida/cena em canal realtime.
- Sincronização de estado entre jogadores.
- Contratos estáveis para evoluir para multiplayer competitivo/cooperativo.

## 8. Regras de operação no Railway

- Não depender de `.env` como premissa local para produção.
- Ler variáveis via `process.env` com validação centralizada.
- Considerar serviços separados: `web`, `api`, `postgres`.

## 9. Riscos e mitigação

1. **Risco:** regra de negócio escorregar para frontend.
   - **Mitigação:** manter frontend apenas como consumidor de casos expostos pela API.

2. **Risco:** crescimento desorganizado da modelagem.
   - **Mitigação:** iniciar por domínio explícito e contratos versionáveis em `packages/shared`.

3. **Risco:** acoplamento precoce ao transporte.
   - **Mitigação:** casos de uso independentes de HTTP/WebSocket.

## 10. Próximo passo recomendado

Implementar a **Fase 0** em mudanças pequenas e revisáveis:

1. Criar esqueleto de pastas.
2. Configurar `package.json` de workspace.
3. Adicionar `prisma/schema.prisma` inicial.
4. Adicionar primeira fatia de domínio (`Match`, `Turn`, `Action`) com testes.

---

Este documento não remove funcionalidades existentes; ele organiza o caminho de evolução com reaproveitamento máximo da especificação atual.
