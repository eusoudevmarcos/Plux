import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import {
  createIngredient,
  deleteIngredient,
  listIngredients,
  updateIngredient,
} from "./ingredients.service.js";
import { ingredientCreateSchema, ingredientUpdateSchema } from "./ingredients.schema.js";

export async function ingredientsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return listIngredients();
  });

  app.post("/", async (request, reply) => {
    try {
      const input = ingredientCreateSchema.parse(request.body);
      return await createIngredient(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.patch("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id?: string };
      const input = ingredientUpdateSchema.parse(request.body);
      return await updateIngredient(parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.delete("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id?: string };
      return await deleteIngredient(parseId(id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao remover ingrediente." });
    }
  });
}

