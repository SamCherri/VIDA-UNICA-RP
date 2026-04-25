import { prisma } from "../lib/prisma.js";
import { logAction } from "../services/log.service.js";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = z
      .object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8)
      })
      .parse(request.body);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] }
    });

    if (exists) {
      return reply.code(409).send({ message: "Usuário ou e-mail já cadastrado." });
    }

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        passwordHash: await hash(body.password, 12)
      }
    });

    await logAction({
      userId: user.id,
      actionType: "auth_register",
      description: `Conta criada para ${user.username}`
    });

    return reply.code(201).send({ id: user.id, username: user.username, email: user.email });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = z
      .object({
        login: z.string().min(3),
        password: z.string().min(8)
      })
      .parse(request.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.login }, { username: body.login }]
      }
    });

    if (!user || user.isBanned) {
      return reply.code(401).send({ message: "Credenciais inválidas." });
    }

    const passwordOk = await compare(body.password, user.passwordHash);
    if (!passwordOk) {
      return reply.code(401).send({ message: "Credenciais inválidas." });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await reply.jwtSign({ userId: user.id }, { expiresIn: "7d" });

    return reply.send({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  app.get("/auth/me", { preHandler: [requireAuth] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.authUser.id },
      select: { id: true, username: true, email: true, role: true, isBanned: true }
    });

    return user;
  });
}
