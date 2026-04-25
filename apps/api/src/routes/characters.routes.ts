import { CharacterLifeStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { logAction } from "../services/log.service.js";

export async function characterRoutes(app: FastifyInstance) {
  app.post("/characters", { preHandler: [requireAuth] }, async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(3),
        age: z.coerce.number().int().min(16).max(99),
        story: z.string().max(500).optional(),
        appearance: z.string().max(300).optional(),
        profession: z.string().max(80).optional()
      })
      .parse(request.body);

    const aliveCharacter = await prisma.character.findFirst({
      where: { userId: request.authUser.id, lifeStatus: CharacterLifeStatus.alive }
    });

    if (aliveCharacter) {
      return reply.code(409).send({ message: "Você já possui um personagem vivo." });
    }

    const defaultLocation = await prisma.location.findFirst({ where: { name: "Praça Central" } });

    const character = await prisma.character.create({
      data: {
        userId: request.authUser.id,
        ...body,
        currentLocationId: defaultLocation?.id,
        moneyCash: 500,
        bankAccount: { create: { balance: 500 } }
      }
    });

    await logAction({
      userId: request.authUser.id,
      characterId: character.id,
      locationId: character.currentLocationId ?? undefined,
      actionType: "character_create",
      description: `${character.name} foi criado`
    });

    return reply.code(201).send(character);
  });

  app.get("/characters/me", { preHandler: [requireAuth] }, async (request) => {
    return prisma.character.findFirst({
      where: { userId: request.authUser.id, lifeStatus: CharacterLifeStatus.alive },
      include: { bankAccount: true, currentLocation: true }
    });
  });

  app.get("/characters/history", { preHandler: [requireAuth] }, async (request) => {
    return prisma.character.findMany({
      where: { userId: request.authUser.id, lifeStatus: CharacterLifeStatus.dead },
      orderBy: { deathAt: "desc" }
    });
  });

  app.post("/characters/:id/mark-dead", { preHandler: [requireAuth] }, async (request, reply) => {
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = z.object({ reason: z.string().min(5).max(250) }).parse(request.body);

    const character = await prisma.character.findFirst({
      where: { id: params.id, userId: request.authUser.id }
    });

    if (!character) {
      return reply.code(404).send({ message: "Personagem não encontrado." });
    }

    if (character.lifeStatus === CharacterLifeStatus.dead) {
      return reply.code(409).send({ message: "Personagem já está morto." });
    }

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        lifeStatus: CharacterLifeStatus.dead,
        deathAt: new Date(),
        deathReason: body.reason,
        moneyCash: 0,
        currentLocationId: null,
        bankAccount: { update: { balance: 0 } },
        deathRecord: { create: { reason: body.reason } }
      }
    });

    await logAction({
      userId: request.authUser.id,
      characterId: updated.id,
      actionType: "character_dead",
      description: `${updated.name} morreu permanentemente`,
      metadata: { reason: body.reason }
    });

    return updated;
  });
}
