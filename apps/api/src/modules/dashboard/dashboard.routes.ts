import type { FastifyInstance } from "fastify";
import { parseId } from "../../lib/http.js";
import { requirePlatformAccess } from "../auth/auth.service.js";
import { getDashboardSummary } from "./dashboard.service.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/summary", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await getDashboardSummary(user.id, { storeId: parseId(storeId) });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao carregar dashboard." });
    }
  });
}
