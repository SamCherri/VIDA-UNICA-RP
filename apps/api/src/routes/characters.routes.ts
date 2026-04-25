import { CharacterLifeStatus, Prisma } from "@prisma/client";
import { PROFESSIONS } from "@vida-unica/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { logAction } from "../services/log.service.js";

const professionSchema = z.enum(PROFESSIONS);
const DEFAULT_PROFESSION = "Desempregado";

function sanitizeProfession(profession?: string) {
  if (!profession?.trim()) {
    return DEFAULT_PROFESSION;
  }

  const parsedProfession = professionSchema.safeParse(profession);
  return parsedProfession.success ? parsedProfession.data : DEFAULT_PROFESSION;
}

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
    const safeProfession = sanitizeProfession(body.profession);

    const defaultLocation = await prisma.location.findFirst({ where: { name: "Praça Central" } });

    try {
      const character = await prisma.$transaction(
        async (tx) => {
          const aliveCharacter = await tx.character.findFirst({
            where: { userId: request.authUser.id, lifeStatus: CharacterLifeStatus.alive },
            select: { id: true }
          });

          if (aliveCharacter) {
            throw new Error("ALIVE_CHARACTER_EXISTS");
          }

          return tx.character.create({
            data: {
              userId: request.authUser.id,
              ...body,
              profession: safeProfession,
              currentLocationId: defaultLocation?.id,
              moneyCash: 500,
              bankAccount: { create: { balance: 500 } }
            }
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      await logAction({
        userId: request.authUser.id,
        characterId: character.id,
        locationId: character.currentLocationId ?? undefined,
        actionType: "character_create",
        description: `${character.name} foi criado`
      });

      return reply.code(201).send(character);
    } catch (error) {
      if (error instanceof Error && error.message === "ALIVE_CHARACTER_EXISTS") {
        return reply.code(409).send({ message: "Você já possui um personagem vivo." });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return reply.code(409).send({ message: "Você já possui um personagem vivo." });
      }

      throw error;
    }
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

    const updated = await prisma.$transaction(async (tx) => {
      const deadCharacter = await tx.character.update({
        where: { id: character.id },
        data: {
          lifeStatus: CharacterLifeStatus.dead,
          deathAt: new Date(),
          deathReason: body.reason,
          moneyCash: 0,
          currentLocationId: null
        }
      });

      await tx.bankAccount.updateMany({
        where: { characterId: character.id },
        data: { balance: 0 }
      });

      await tx.deathRecord.upsert({
        where: { characterId: character.id },
        update: { reason: body.reason },
        create: { characterId: character.id, reason: body.reason }
      });

      return deadCharacter;
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

  app.post("/characters/me/profession", { preHandler: [requireAuth] }, async (request, reply) => {
    const body = z.object({ profession: professionSchema }).parse(request.body);

    const character = await prisma.character.findFirst({
      where: { userId: request.authUser.id, lifeStatus: CharacterLifeStatus.alive }
    });

    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

    if (character.isFrozen) {
      return reply.code(400).send({ message: "Personagem congelado não pode trocar de profissão." });
    }

    const updatedCharacter = await prisma.character.update({
      where: { id: character.id },
      data: { profession: body.profession },
      include: { bankAccount: true, currentLocation: true }
    });

    await logAction({
      userId: request.authUser.id,
      characterId: character.id,
      locationId: character.currentLocationId ?? undefined,
      actionType: "profession_change",
      description: `${character.name} mudou de profissão para ${body.profession}`,
      metadata: { profession: body.profession }
    });

    return updatedCharacter;
  });
}
