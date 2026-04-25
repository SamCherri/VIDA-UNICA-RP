import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type ActionLogInput = {
  userId: string;
  characterId?: string;
  locationId?: string;
  actionType: string;
  description: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logAction(input: ActionLogInput) {
  await prisma.actionLog.create({
    data: {
      userId: input.userId,
      characterId: input.characterId,
      locationId: input.locationId,
      actionType: input.actionType,
      description: input.description,
      metadata: input.metadata
    }
  });
}

export async function logAdmin(actorUserId: string, targetType: string, targetId: string, actionType: string, reason?: string) {
  await prisma.adminLog.create({
    data: { actorUserId, targetType, targetId, actionType, reason }
  });
}
