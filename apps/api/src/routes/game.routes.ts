import { UserRole } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { assertCooldown } from "../lib/cooldown.js";
import { requireAuth } from "../middleware/auth.js";
import { logAction } from "../services/log.service.js";

const NPC_COOLDOWN_MS = 6000;
const OFFICIAL_NPC_ROLES = new Set<UserRole>([UserRole.admin, UserRole.master_admin]);

export async function gameRoutes(app: FastifyInstance) {
  app.post("/game/npc-fallback", { preHandler: [requireAuth] }, async (request, reply) => {
    const body = z
      .object({
        category: z.string().min(3).max(50),
        details: z.string().min(5).max(500),
        locationId: z.string().cuid().optional(),
        asOfficial: z.boolean().optional().default(false)
      })
      .parse(request.body);

    const cooldown = assertCooldown(`npc:${request.authUser.id}`, NPC_COOLDOWN_MS);
    if (cooldown.blocked) {
      return reply
        .code(429)
        .header("Retry-After", cooldown.retryAfterSeconds)
        .send({ message: "Solicitação enviada há pouco tempo. Aguarde antes de tentar novamente." });
    }

    const canCreateOfficial = OFFICIAL_NPC_ROLES.has(request.authUser.role);
    const status = body.asOfficial && canCreateOfficial ? "official" : "requested";

    const event = await prisma.npcFallbackEvent.create({
      data: {
        category: body.category,
        details: body.details,
        locationId: body.locationId,
        requestedByUserId: request.authUser.id,
        requestedByRole: request.authUser.role,
        status
      }
    });

    await logAction({
      userId: request.authUser.id,
      locationId: body.locationId,
      actionType: status === "official" ? "npc_fallback_official" : "npc_fallback_request",
      description:
        status === "official"
          ? `Evento NPC oficial criado: ${body.category}`
          : `Solicitação de NPC fallback registrada: ${body.category}`,
      metadata: {
        details: body.details,
        status,
        requestedByRole: request.authUser.role
      }
    });

    return {
      id: event.id,
      status: event.status,
      message:
        event.status === "official"
          ? "Evento NPC oficial registrado."
          : "Solicitação de NPC recebida e registrada para avaliação."
    };
  });
}
