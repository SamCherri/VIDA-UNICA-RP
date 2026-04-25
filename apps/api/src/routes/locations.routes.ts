import { CharacterLifeStatus } from "@prisma/client";
import { PROFESSIONS, type AvailableSceneAction, type Profession, type RiskLevel } from "@vida-unica/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { logAction } from "../services/log.service.js";
import { assertCooldown } from "../lib/cooldown.js";
import { applyRoutineDecay } from "../services/routine.service.js";

const SAY_COOLDOWN_MS = 2500;
const ACTION_COOLDOWN_MS = 2000;
const DEFAULT_PROFESSION: Profession = "Desempregado";

const sceneActionSchema = z.enum([
  "Conversar",
  "Observar",
  "Entrar",
  "Sair",
  "Solicitar atendimento",
  "Sacar dinheiro",
  "Depositar",
  "Chamar polícia",
  "Solicitar médico",
  "Sacar arma",
  "Assaltar",
  "Se render",
  "Fugir"
]);

const professionalActionSchema = z.object({
  actionId: z.string().min(1)
});

const COMMON_AVAILABLE_ACTIONS: AvailableSceneAction[] = [
  { id: "common_talk", label: "Conversar", category: "Comum", riskLevel: "LOW" },
  { id: "common_observe", label: "Observar", category: "Comum", riskLevel: "LOW" },
  { id: "common_ask_for_help", label: "Pedir ajuda", category: "Comum", riskLevel: "LOW" },
  { id: "common_leave", label: "Sair", category: "Comum", riskLevel: "LOW" }
];

type ProfessionalCatalogAction = AvailableSceneAction & {
  sceneText: string;
};

const PROFESSIONAL_ACTION_CATALOG: Record<string, ProfessionalCatalogAction[]> = {
  Hospital: [
    {
      id: "hospital_register_patient",
      label: "Registrar paciente",
      category: "Hospital",
      requiresProfession: "Atendente do Hospital",
      riskLevel: "LOW",
      sceneText: "registrou um paciente na recepção do Hospital."
    },
    {
      id: "hospital_call_npc_doctor",
      label: "Chamar médico NPC",
      category: "Hospital",
      requiresProfession: "Atendente do Hospital",
      riskLevel: "LOW",
      sceneText: "chamou um médico NPC para apoiar o atendimento no Hospital."
    },
    {
      id: "hospital_open_care_record",
      label: "Abrir ficha de atendimento",
      category: "Hospital",
      requiresProfession: "Atendente do Hospital",
      riskLevel: "LOW",
      sceneText: "abriu uma ficha de atendimento no Hospital."
    },
    {
      id: "hospital_redirect_emergency",
      label: "Encaminhar para emergência",
      category: "Hospital",
      requiresProfession: "Atendente do Hospital",
      riskLevel: "MEDIUM",
      sceneText: "encaminhou um paciente para a emergência do Hospital."
    }
  ],
  "Banco Central": [
    {
      id: "bank_assist_customer",
      label: "Atender cliente",
      category: "Banco",
      requiresProfession: "Caixa de Banco",
      riskLevel: "LOW",
      sceneText: "atendeu um cliente no Banco Central."
    },
    {
      id: "bank_register_withdrawal",
      label: "Registrar saque",
      category: "Banco",
      requiresProfession: "Caixa de Banco",
      riskLevel: "LOW",
      sceneText: "registrou um saque no Banco Central."
    },
    {
      id: "bank_register_deposit",
      label: "Registrar depósito",
      category: "Banco",
      requiresProfession: "Caixa de Banco",
      riskLevel: "LOW",
      sceneText: "registrou um depósito no Banco Central."
    },
    {
      id: "bank_call_npc_manager",
      label: "Chamar gerente NPC",
      category: "Banco",
      requiresProfession: "Caixa de Banco",
      riskLevel: "LOW",
      sceneText: "chamou o gerente NPC no Banco Central."
    },
    {
      id: "security_watch_entrance",
      label: "Observar entrada",
      category: "Segurança",
      requiresProfession: "Segurança",
      riskLevel: "MEDIUM",
      sceneText: "observou a entrada do Banco Central."
    },
    {
      id: "security_approach_suspect",
      label: "Abordar suspeito",
      category: "Segurança",
      requiresProfession: "Segurança",
      riskLevel: "MEDIUM",
      sceneText: "abordou um suspeito no Banco Central."
    },
    {
      id: "security_call_police",
      label: "Acionar polícia",
      category: "Segurança",
      requiresProfession: "Segurança",
      riskLevel: "HIGH",
      sceneText: "acionou a polícia no Banco Central."
    },
    {
      id: "security_protect_employee",
      label: "Proteger funcionário",
      category: "Segurança",
      requiresProfession: "Segurança",
      riskLevel: "MEDIUM",
      sceneText: "protegeu um funcionário no Banco Central."
    }
  ],
  Delegacia: [
    {
      id: "police_view_calls",
      label: "Ver chamados",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "LOW",
      sceneText: "consultou os chamados na Delegacia."
    },
    {
      id: "police_take_case",
      label: "Assumir ocorrência",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "MEDIUM",
      sceneText: "assumiu uma ocorrência na Delegacia."
    },
    {
      id: "police_register_approach",
      label: "Registrar abordagem",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "MEDIUM",
      sceneText: "registrou uma abordagem na Delegacia."
    },
    {
      id: "police_request_backup_station",
      label: "Solicitar reforço",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "HIGH",
      sceneText: "solicitou reforço a partir da Delegacia."
    }
  ],
  "Praça Central": [
    {
      id: "police_patrol_square",
      label: "Patrulhar praça",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "MEDIUM",
      sceneText: "patrulhou a Praça Central."
    },
    {
      id: "police_approach_square",
      label: "Abordar suspeito",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "MEDIUM",
      sceneText: "abordou um suspeito na Praça Central."
    },
    {
      id: "police_orient_citizen",
      label: "Orientar cidadão",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "LOW",
      sceneText: "orientou um cidadão na Praça Central."
    }
  ],
  "Beco Industrial": [
    {
      id: "police_patrol_risk_area",
      label: "Patrulhar área de risco",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "HIGH",
      sceneText: "patrulhou a área de risco do Beco Industrial."
    },
    {
      id: "police_request_backup_beco",
      label: "Solicitar reforço",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "HIGH",
      sceneText: "solicitou reforço no Beco Industrial."
    },
    {
      id: "police_preserve_scene",
      label: "Preservar cena",
      category: "Polícia",
      requiresProfession: "Policial",
      riskLevel: "MEDIUM",
      sceneText: "preservou uma cena no Beco Industrial."
    }
  ]
};

function getCharacterProfession(profession?: string | null): Profession {
  const parsed = z.enum(PROFESSIONS).safeParse(profession);
  return parsed.success ? parsed.data : DEFAULT_PROFESSION;
}

function getAvailableActionsForLocation({
  locationName,
  locationRiskLevel,
  profession
}: {
  locationName: string;
  locationRiskLevel: RiskLevel;
  profession: Profession;
}): AvailableSceneAction[] {
  const professionalActions = (PROFESSIONAL_ACTION_CATALOG[locationName] ?? [])
    .filter((action) => action.requiresProfession === profession)
    .map<AvailableSceneAction>(({ sceneText: _sceneText, ...action }) => ({
      ...action,
      riskLevel: action.riskLevel ?? locationRiskLevel
    }));

  return [...COMMON_AVAILABLE_ACTIONS, ...professionalActions];
}

function getProfessionalActionById(locationName: string, actionId: string) {
  return (PROFESSIONAL_ACTION_CATALOG[locationName] ?? []).find((action) => action.id === actionId);
}

async function getAliveCharacter(userId: string) {
  return prisma.character.findFirst({
    where: { userId, lifeStatus: CharacterLifeStatus.alive, isFrozen: false }
  });
}

export async function locationRoutes(app: FastifyInstance) {
  app.get("/locations", { preHandler: [requireAuth] }, async () => {
    return prisma.location.findMany({ orderBy: { name: "asc" } });
  });

  app.get("/locations/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      return reply.code(404).send({ message: "Local não encontrado." });
    }
    return location;
  });

  app.post("/locations/:id/enter", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    let character = await getAliveCharacter(request.authUser.id);

    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

    character = await applyRoutineDecay(character, (characterId, data) =>
      prisma.character.update({
        where: { id: characterId },
        data
      })
    );

    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      return reply.code(404).send({ message: "Local não encontrado." });
    }

    await prisma.character.update({
      where: { id: character.id },
      data: { currentLocationId: location.id }
    });

    await prisma.locationMessage.create({
      data: {
        locationId: location.id,
        characterId: character.id,
        messageType: "system",
        content: `${character.name} entrou em ${location.name}.`
      }
    });

    await logAction({
      userId: request.authUser.id,
      characterId: character.id,
      locationId: location.id,
      actionType: "location_enter",
      description: `${character.name} entrou em ${location.name}`
    });

    return { ok: true };
  });

  app.post("/locations/:id/leave", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    let character = await getAliveCharacter(request.authUser.id);

    if (!character || character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Você não está nesse local." });
    }
    character = await applyRoutineDecay(character, (characterId, data) =>
      prisma.character.update({
        where: { id: characterId },
        data
      })
    );

    await prisma.locationMessage.create({
      data: {
        locationId: id,
        characterId: character.id,
        messageType: "system",
        content: `${character.name} saiu do local.`
      }
    });

    await prisma.character.update({ where: { id: character.id }, data: { currentLocationId: null } });

    await logAction({
      userId: request.authUser.id,
      characterId: character.id,
      locationId: id,
      actionType: "location_leave",
      description: `${character.name} saiu do local`
    });

    return { ok: true };
  });


  app.get("/locations/:id/presence", { preHandler: [requireAuth] }, async (request) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    return prisma.character.findMany({
      where: {
        currentLocationId: id,
        lifeStatus: CharacterLifeStatus.alive
      },
      select: {
        id: true,
        name: true,
        profession: true,
        lifeStatus: true
      },
      orderBy: { name: "asc" }
    });
  });

  app.get("/locations/:id/messages", { preHandler: [requireAuth] }, async (request) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const recentMessages = await prisma.locationMessage.findMany({
      where: { locationId: id },
      include: { character: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return recentMessages.reverse();
  });

  app.get("/locations/:id/available-actions", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    let character = await getAliveCharacter(request.authUser.id);
    if (!character) {
      return reply.code(400).send({ message: "Personagem vivo não encontrado." });
    }

    character = await applyRoutineDecay(character, (characterId, data) =>
      prisma.character.update({
        where: { id: characterId },
        data
      })
    );

    if (character.lifeStatus !== CharacterLifeStatus.alive) {
      return reply.code(400).send({ message: "Personagem morto não pode executar ações." });
    }

    if (character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Seu personagem precisa estar neste local." });
    }

    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      return reply.code(404).send({ message: "Local não encontrado." });
    }

    const availableActions = getAvailableActionsForLocation({
      locationName: location.name,
      locationRiskLevel: location.riskLevel,
      profession: getCharacterProfession(character.profession)
    });

    return availableActions;
  });

  app.post("/locations/:id/say", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = z.object({ content: z.string().min(1).max(240) }).parse(request.body);

    const cooldown = assertCooldown(`say:${request.authUser.id}:${id}`, SAY_COOLDOWN_MS);
    if (cooldown.blocked) {
      return reply
        .code(429)
        .header("Retry-After", cooldown.retryAfterSeconds)
        .send({ message: "Você está falando rápido demais. Aguarde alguns segundos." });
    }

    let character = await getAliveCharacter(request.authUser.id);

    if (!character || character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Seu personagem precisa estar no local para falar." });
    }
    character = await applyRoutineDecay(character, (characterId, data) =>
      prisma.character.update({
        where: { id: characterId },
        data
      })
    );

    const message = await prisma.locationMessage.create({
      data: {
        locationId: id,
        characterId: character.id,
        messageType: "say",
        content: body.content
      }
    });

    await logAction({
      userId: request.authUser.id,
      characterId: character.id,
      locationId: id,
      actionType: "scene_say",
      description: `${character.name} falou na cena`
    });

    return message;
  });

  app.post("/locations/:id/action", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = z.object({ action: sceneActionSchema }).parse(request.body);

    const cooldown = assertCooldown(`action:${request.authUser.id}:${id}`, ACTION_COOLDOWN_MS);
    if (cooldown.blocked) {
      return reply
        .code(429)
        .header("Retry-After", cooldown.retryAfterSeconds)
        .send({ message: "Ação executada rápido demais. Aguarde para tentar novamente." });
    }

    let character = await getAliveCharacter(request.authUser.id);

    if (!character || character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Seu personagem precisa estar no local para agir." });
    }
    character = await applyRoutineDecay(character, (characterId, data) =>
      prisma.character.update({
        where: { id: characterId },
        data
      })
    );

    const systemText = `${character.name} executou a ação: ${body.action}.`;
    const message = await prisma.locationMessage.create({
      data: {
        locationId: id,
        characterId: character.id,
        messageType: "action",
        content: systemText
      }
    });

    await logAction({
      userId: request.authUser.id,
      characterId: character.id,
      locationId: id,
      actionType: `scene_action_${body.action}`,
      description: systemText
    });

    return message;
  });

  app.post("/locations/:id/professional-action", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = professionalActionSchema.parse(request.body);

    let character = await getAliveCharacter(request.authUser.id);
    if (!character) {
      return reply.code(400).send({ message: "Personagem vivo não encontrado." });
    }

    if (character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Seu personagem precisa estar neste local." });
    }

    character = await applyRoutineDecay(character, (characterId, data) =>
      prisma.character.update({
        where: { id: characterId },
        data
      })
    );

    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      return reply.code(404).send({ message: "Local não encontrado." });
    }

    const action = getProfessionalActionById(location.name, body.actionId);
    if (!action) {
      return reply.code(400).send({ message: "Ação profissional inválida para este local." });
    }

    const characterProfession = getCharacterProfession(character.profession);
    if (action.requiresProfession !== characterProfession) {
      return reply.code(403).send({ message: "Sua profissão atual não permite essa ação." });
    }

    const content = `${character.name} ${action.sceneText}`;
    const message = await prisma.locationMessage.create({
      data: {
        locationId: id,
        characterId: character.id,
        messageType: "action",
        content
      }
    });

    await logAction({
      userId: request.authUser.id,
      characterId: character.id,
      locationId: id,
      actionType: "professional_action",
      description: content,
      metadata: {
        actionId: action.id,
        locationName: location.name,
        profession: characterProfession
      }
    });

    return message;
  });
}
