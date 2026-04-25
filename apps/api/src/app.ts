import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { characterRoutes } from "./routes/characters.routes.js";
import { locationRoutes } from "./routes/locations.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { gameRoutes } from "./routes/game.routes.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(sensible);
  await app.register(cors, { origin: env.WEB_ORIGIN });
  await app.register(jwt, { secret: env.JWT_SECRET });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: "Dados inválidos.",
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      });
    }

    request.log.error(error);

    if (env.NODE_ENV === "production") {
      return reply.code(500).send({ message: "Erro interno no servidor." });
    }

    return reply.code(500).send({
      message: "Erro interno no servidor.",
      detail: error instanceof Error ? error.message : "Erro desconhecido"
    });
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(characterRoutes);
  await app.register(locationRoutes);
  await app.register(adminRoutes);
  await app.register(gameRoutes);

  return app;
}
