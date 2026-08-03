import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requirePlatformAccess } from "../auth/auth.service.js";
import {
  createIngredient,
  deleteIngredient,
  listIngredients,
  updateIngredient,
} from "./ingredients.service.js";
import { ingredientCreateSchema, ingredientUpdateSchema } from "./ingredients.schema.js";

export async function ingredientsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      await requirePlatformAccess(request);
      return listIngredients();
    } catch (error) {
      return reply.code(403).send({ message: error instanceof Error ? error.message : "Acesso bloqueado." });
    }
  });

  app.post("/", async (request, reply) => {
    try {
      await requirePlatformAccess(request);
      const input = ingredientCreateSchema.parse(request.body);
      return await createIngredient(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.patch("/:id", async (request, reply) => {
    try {
      await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      const input = ingredientUpdateSchema.parse(request.body);
      return await updateIngredient(parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.delete("/:id", async (request, reply) => {
    try {
      await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      return await deleteIngredient(parseId(id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao remover ingrediente." });
    }
  });
}
