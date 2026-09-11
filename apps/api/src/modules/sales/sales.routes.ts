import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requirePlatformAccess } from "../auth/auth.service.js";
import { cancelSale, checkoutSale, listSales } from "./sales.service.js";
import { saleCheckoutSchema } from "./sales.schema.js";

export async function salesRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await listSales(user.id, { storeId });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao listar vendas." });
    }
  });

  app.post("/checkout", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const input = saleCheckoutSchema.parse(request.body);
      return await checkoutSale(user.id, input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/:id/cancel", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      return await cancelSale(user.id, parseId(id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao cancelar venda." });
    }
  });
}
