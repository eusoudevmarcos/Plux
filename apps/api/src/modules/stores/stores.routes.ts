import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requireUser } from "../auth/auth.service.js";
import { createStore, getStore, listStores, updateStore } from "./stores.service.js";
import { storeCreateSchema, storeUpdateSchema } from "./stores.schema.js";

export async function storesRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const user = await requireUser(request);
      return listStores(user.id);
    } catch (error) {
      return reply.code(401).send({ message: error instanceof Error ? error.message : "Nao autorizado." });
    }
  });

  app.get("/:id", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { id } = request.params as { id?: string };
      const store = await getStore(user.id, parseId(id));

      if (!store) {
        return reply.code(404).send({ message: "Loja nao encontrada." });
      }

      return store;
    } catch (error) {
      return reply.code(401).send({ message: error instanceof Error ? error.message : "Nao autorizado." });
    }
  });

  app.post("/", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const input = storeCreateSchema.parse(request.body);
      return await createStore(user.id, input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.put("/:id", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { id } = request.params as { id?: string };
      const input = storeUpdateSchema.parse(request.body);
      return await updateStore(user.id, parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
