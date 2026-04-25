import { UserRole } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { logAdmin } from "../services/log.service.js";

const VIEW_ROLES: UserRole[] = [UserRole.support, UserRole.moderator, UserRole.admin, UserRole.master_admin];
const FREEZE_ROLES: UserRole[] = [UserRole.moderator, UserRole.admin, UserRole.master_admin];
const BAN_ROLES: UserRole[] = [UserRole.admin, UserRole.master_admin];

export async function adminRoutes(app: FastifyInstance) {
  app.get("/admin/users", { preHandler: [requireAuth, requireRoles(VIEW_ROLES)] }, async () => {
    return prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, isBanned: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
  });

  app.get("/admin/characters", { preHandler: [requireAuth, requireRoles(VIEW_ROLES)] }, async () => {
    return prisma.character.findMany({
      select: { id: true, name: true, lifeStatus: true, isFrozen: true, createdAt: true, userId: true },
      orderBy: { createdAt: "desc" }
    });
  });

  app.get("/admin/logs", { preHandler: [requireAuth, requireRoles(VIEW_ROLES)] }, async () => {
    const [actionLogs, adminLogs] = await Promise.all([
      prisma.actionLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
    ]);

    return { actionLogs, adminLogs };
  });

  app.post("/admin/users/:id/ban", { preHandler: [requireAuth, requireRoles(BAN_ROLES)] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = z.object({ reason: z.string().min(5).max(250) }).parse(request.body);

    const updated = await prisma.user
      .update({
        where: { id },
        data: { isBanned: true, banReason: body.reason },
        select: { id: true, username: true, isBanned: true, banReason: true }
      })
      .catch(() => null);

    if (!updated) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }

    await logAdmin(request.authUser.id, "user", id, "ban", body.reason);

    return updated;
  });

  app.post("/admin/characters/:id/freeze", { preHandler: [requireAuth, requireRoles(FREEZE_ROLES)] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = z.object({ reason: z.string().min(5).max(250) }).parse(request.body);

    const updated = await prisma.character
      .update({
        where: { id },
        data: { isFrozen: true },
        select: { id: true, name: true, isFrozen: true }
      })
      .catch(() => null);

    if (!updated) {
      return reply.code(404).send({ message: "Personagem não encontrado." });
    }

    await logAdmin(request.authUser.id, "character", id, "freeze", body.reason);

    return updated;
  });
}
