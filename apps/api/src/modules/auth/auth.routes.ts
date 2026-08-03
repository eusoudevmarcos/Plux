import type { FastifyInstance } from "fastify";
import { formatZodError } from "../../lib/http.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { getBearerToken, getUserFromToken, login, logout, register } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    try {
      const input = registerSchema.parse(request.body);
      return await register(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/login", async (request, reply) => {
    try {
      const input = loginSchema.parse(request.body);
      return await login(input);
    } catch (error) {
      return reply.code(401).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.get("/me", async (request, reply) => {
    const user = await getUserFromToken(getBearerToken(request));

    if (!user) {
      return reply.code(401).send({ message: "Sessao invalida ou expirada." });
    }

    return { user };
  });

  app.post("/logout", async (request) => {
    return logout(getBearerToken(request));
  });
}
