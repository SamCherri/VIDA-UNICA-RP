import { CharacterLifeStatus, Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  applyRoutineDecay,
  buildRoutinePayload,
  canWorkAtLocation,
  canCharacterWork,
  getWorkSalary,
  WORK_COOLDOWN_MS
} from "../services/routine.service.js";

const BAD_WORK_CONDITION_MESSAGE = "Você está em condição ruim para trabalhar. Cuide da sua vida antes.";

async function getAliveCharacter(userId: string) {
  return prisma.character.findFirst({
    where: {
      userId,
      lifeStatus: CharacterLifeStatus.alive,
      isFrozen: false
    },
    include: {
      currentLocation: true
    }
  });
}

async function applyDecayWithDefaultClient(character: NonNullable<Awaited<ReturnType<typeof getAliveCharacter>>>) {
  return applyRoutineDecay(character, (id, data) =>
    prisma.character.update({
      where: { id },
      data
    })
  );
}

async function createRoutineMessage(tx: Prisma.TransactionClient, character: { currentLocationId: string | null; id: string }, content: string, messageType: "routine" | "work") {
  if (!character.currentLocationId) {
    return;
  }

  await tx.locationMessage.create({
    data: {
      locationId: character.currentLocationId,
      characterId: character.id,
      messageType,
      content
    }
  });
}

export async function routineRoutes(app: FastifyInstance) {
  app.get("/routine/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const character = await getAliveCharacter(request.authUser.id);

    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

    const updatedCharacter = await applyDecayWithDefaultClient(character);

    return buildRoutinePayload(updatedCharacter, character.currentLocation?.name);
  });

  app.post("/routine/eat", { preHandler: [requireAuth] }, async (request, reply) => {
    const character = await getAliveCharacter(request.authUser.id);
    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

    if (character.moneyCash < 25) {
      return reply.code(400).send({ message: "Dinheiro insuficiente para comer agora." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const decayed = await applyRoutineDecay(character, (id, data) => tx.character.update({ where: { id }, data }));
      const updatedCharacter = await tx.character.update({
        where: { id: character.id },
        data: {
          hunger: Math.min(100, decayed.hunger + 30),
          energy: Math.min(100, decayed.energy + 5),
          moneyCash: { decrement: 25 },
          routineUpdatedAt: new Date()
        }
      });

      const message = `${updatedCharacter.name} fez uma refeição simples.`;

      await createRoutineMessage(tx, updatedCharacter, message, "routine");

      await tx.actionLog.create({
        data: {
          userId: request.authUser.id,
          characterId: updatedCharacter.id,
          locationId: updatedCharacter.currentLocationId,
          actionType: "routine_eat",
          description: message,
          metadata: { cost: 25 }
        }
      });

      return updatedCharacter;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return buildRoutinePayload(result, character.currentLocation?.name);
  });

  app.post("/routine/drink", { preHandler: [requireAuth] }, async (request, reply) => {
    const character = await getAliveCharacter(request.authUser.id);
    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

    if (character.moneyCash < 10) {
      return reply.code(400).send({ message: "Dinheiro insuficiente para beber água agora." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const decayed = await applyRoutineDecay(character, (id, data) => tx.character.update({ where: { id }, data }));

      const updatedCharacter = await tx.character.update({
        where: { id: character.id },
        data: {
          thirst: Math.min(100, decayed.thirst + 35),
          moneyCash: { decrement: 10 },
          routineUpdatedAt: new Date()
        }
      });

      const message = `${updatedCharacter.name} bebeu água.`;

      await createRoutineMessage(tx, updatedCharacter, message, "routine");

      await tx.actionLog.create({
        data: {
          userId: request.authUser.id,
          characterId: updatedCharacter.id,
          locationId: updatedCharacter.currentLocationId,
          actionType: "routine_drink",
          description: message,
          metadata: { cost: 10 }
        }
      });

      return updatedCharacter;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return buildRoutinePayload(result, character.currentLocation?.name);
  });

  app.post("/routine/rest", { preHandler: [requireAuth] }, async (request, reply) => {
    const character = await getAliveCharacter(request.authUser.id);
    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const decayed = await applyRoutineDecay(character, (id, data) => tx.character.update({ where: { id }, data }));

      const updatedCharacter = await tx.character.update({
        where: { id: character.id },
        data: {
          sleep: Math.min(100, decayed.sleep + 25),
          energy: Math.min(100, decayed.energy + 20),
          routineUpdatedAt: new Date()
        }
      });

      const message = `${updatedCharacter.name} descansou por um tempo.`;

      await createRoutineMessage(tx, updatedCharacter, message, "routine");

      await tx.actionLog.create({
        data: {
          userId: request.authUser.id,
          characterId: updatedCharacter.id,
          locationId: updatedCharacter.currentLocationId,
          actionType: "routine_rest",
          description: message
        }
      });

      return updatedCharacter;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return buildRoutinePayload(result, character.currentLocation?.name);
  });

  app.post("/routine/work", { preHandler: [requireAuth] }, async (request, reply) => {
    const character = await getAliveCharacter(request.authUser.id);
    if (!character) {
      return reply.code(404).send({ message: "Personagem vivo não encontrado." });
    }

    const salary = getWorkSalary(character.profession);
    if (salary <= 0) {
      return reply.code(400).send({ message: "Sua profissão atual não possui trabalho disponível neste local." });
    }

    const locationRule = canWorkAtLocation(character.profession, character.currentLocation?.name);
    if (!locationRule.canWork) {
      return reply.code(400).send({ message: locationRule.message });
    }

    const result = await prisma.$transaction(async (tx) => {
      const decayed = await applyRoutineDecay(character, (id, data) => tx.character.update({ where: { id }, data }));

      if (!canCharacterWork(decayed)) {
        return { blocked: true as const };
      }

      if (decayed.lastWorkAt) {
        const cooldownRemainingMs = WORK_COOLDOWN_MS - (Date.now() - decayed.lastWorkAt.getTime());
        if (cooldownRemainingMs > 0) {
          return { blocked: true as const, cooldownRemainingMs };
        }
      }

      const updatedCharacter = await tx.character.update({
        where: { id: decayed.id },
        data: {
          hunger: Math.max(0, decayed.hunger - 10),
          thirst: Math.max(0, decayed.thirst - 12),
          sleep: Math.max(0, decayed.sleep - 8),
          energy: Math.max(0, decayed.energy - 15),
          moneyCash: { increment: salary },
          workStreak: { increment: 1 },
          lastWorkAt: new Date(),
          routineUpdatedAt: new Date()
        }
      });

      const message = `${updatedCharacter.name} trabalhou como ${updatedCharacter.profession ?? "Desempregado"} no ${character.currentLocation?.name ?? "local atual"} e recebeu R$ ${salary}.`;

      await createRoutineMessage(tx, updatedCharacter, message, "work");

      await tx.actionLog.create({
        data: {
          userId: request.authUser.id,
          characterId: updatedCharacter.id,
          locationId: updatedCharacter.currentLocationId,
          actionType: "routine_work",
          description: message,
          metadata: {
            salary,
            profession: updatedCharacter.profession
          }
        }
      });

      return { blocked: false as const, character: updatedCharacter };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (result.blocked) {
      if (typeof result.cooldownRemainingMs === "number") {
        return reply.code(429).send({
          message: `Você precisa aguardar ${Math.ceil(result.cooldownRemainingMs / 60000)} minuto(s) para trabalhar novamente.`
        });
      }

      return reply.code(400).send({ message: BAD_WORK_CONDITION_MESSAGE });
    }

    return buildRoutinePayload(result.character, character.currentLocation?.name);
  });
}
