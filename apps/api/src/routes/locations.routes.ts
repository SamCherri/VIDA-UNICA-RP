import { CharacterLifeStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { logAction } from "../services/log.service.js";
import { assertCooldown } from "../lib/cooldown.js";

const SAY_COOLDOWN_MS = 2500;
const ACTION_COOLDOWN_MS = 2000;

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
    const character = await getAliveCharacter(request.authUser.id);

    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

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
    const character = await getAliveCharacter(request.authUser.id);

    if (!character || character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Você não está nesse local." });
    }

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

    const character = await getAliveCharacter(request.authUser.id);

    if (!character || character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Seu personagem precisa estar no local para falar." });
    }

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

    const character = await getAliveCharacter(request.authUser.id);

    if (!character || character.currentLocationId !== id) {
      return reply.code(400).send({ message: "Seu personagem precisa estar no local para agir." });
    }

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
}
