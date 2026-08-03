import type { FastifyInstance } from "fastify";
import { requirePlatformAccess } from "../auth/auth.service.js";
import { getProductFinancialReport } from "./financial.service.js";

export async function financialRoutes(app: FastifyInstance) {
  app.get("/product-report", async (request, reply) => {
    try {
      await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return getProductFinancialReport({ storeId });
    } catch (error) {
      return reply.code(403).send({ message: error instanceof Error ? error.message : "Acesso bloqueado." });
    }
  });
}
