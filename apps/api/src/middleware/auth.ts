import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyRequest {
    authUser: { id: string; role: UserRole };
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ userId: string }>();

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isBanned: true }
    });

    if (!user || user.isBanned) {
      return reply.code(401).send({ message: "Não autorizado" });
    }

    request.authUser = { id: user.id, role: user.role };
  } catch {
    return reply.code(401).send({ message: "Não autorizado" });
  }
}

export function requireRoles(roles: UserRole[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply) {
    if (!roles.includes(request.authUser.role)) {
      return reply.code(403).send({ message: "Acesso negado" });
    }
  };
}
