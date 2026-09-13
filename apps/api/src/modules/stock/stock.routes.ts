import type { FastifyInstance } from "fastify";
import { requirePlatformAccess } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { parseId } from "../../lib/http.js";
import { getCriticalStockReport } from "../dashboard/dashboard.service.js";

export async function stockRoutes(app: FastifyInstance) {
  app.get("/movements", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };

      if (storeId) {
        const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: user.id } });
        if (!store) return reply.code(404).send({ message: "Loja nao encontrada." });
      }

      return prisma.stockMovement.findMany({
        where: storeId ? { storeId } : { store: { ownerId: user.id } },
        include: { ingredient: true, store: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao listar estoque." });
    }
  });

  app.get("/critical", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await getCriticalStockReport(user.id, { storeId: parseId(storeId) });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao listar estoque critico." });
    }
  });
}
