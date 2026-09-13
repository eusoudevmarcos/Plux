import type { FastifyInstance } from "fastify";
import { requirePlatformAccess } from "../auth/auth.service.js";
import { getBetaReadiness } from "./system.service.js";

export async function systemRoutes(app: FastifyInstance) {
  app.get("/beta-readiness", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await getBetaReadiness(user.id, { storeId });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao carregar status." });
    }
  });
}
