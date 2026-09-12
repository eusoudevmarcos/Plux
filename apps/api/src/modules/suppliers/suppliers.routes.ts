import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requirePlatformAccess } from "../auth/auth.service.js";
import { createSupplier, listSuppliers, updateSupplier } from "./suppliers.service.js";
import { supplierCreateSchema, supplierUpdateSchema } from "./suppliers.schema.js";

export async function suppliersRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await listSuppliers(user.id, parseId(storeId));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao listar fornecedores." });
    }
  });

  app.post("/", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const input = supplierCreateSchema.parse(request.body);
      return await createSupplier(user.id, input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.patch("/:id", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      const input = supplierUpdateSchema.parse(request.body);
      return await updateSupplier(user.id, parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
