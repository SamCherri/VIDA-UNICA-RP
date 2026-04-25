import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { logAction } from "../services/log.service.js";

export async function gameRoutes(app: FastifyInstance) {
  app.post("/game/npc-fallback", { preHandler: [requireAuth] }, async (request) => {
    const body = z
      .object({
        category: z.string().min(3).max(50),
        details: z.string().min(5).max(500),
        locationId: z.string().cuid().optional()
      })
      .parse(request.body);

    const event = await prisma.npcFallbackEvent.create({
      data: {
        category: body.category,
        details: body.details,
        locationId: body.locationId
      }
    });

    await logAction({
      userId: request.authUser.id,
      locationId: body.locationId,
      actionType: "npc_fallback_request",
      description: `Evento NPC fallback: ${body.category}`,
      metadata: { details: body.details }
    });

    return event;
  });
}
