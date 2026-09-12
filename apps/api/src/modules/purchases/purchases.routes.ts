import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requirePlatformAccess } from "../auth/auth.service.js";
import { createPurchase, listAccountPayables, listPurchases } from "./purchases.service.js";
import { purchaseCreateSchema } from "./purchases.schema.js";

export async function purchasesRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await listPurchases(user.id, { storeId: parseId(storeId) });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao listar compras." });
    }
  });

  app.get("/payables", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await listAccountPayables(user.id, { storeId: parseId(storeId) });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao listar contas a pagar." });
    }
  });

  app.post("/", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const input = purchaseCreateSchema.parse(request.body);
      return await createPurchase(user.id, input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
