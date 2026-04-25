import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
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

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(characterRoutes);
  await app.register(locationRoutes);
  await app.register(adminRoutes);
  await app.register(gameRoutes);

  return app;
}
