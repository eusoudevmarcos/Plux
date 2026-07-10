import type { FastifyInstance } from "fastify";
import { formatZodError } from "../../lib/http.js";
import { createProductFull, listProducts } from "./products.service.js";
import { productCreateFullSchema } from "./products.schema.js";

export async function productsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return listProducts();
  });

  app.post("/create-full", async (request, reply) => {
    try {
      const input = productCreateFullSchema.parse(request.body);
      return await createProductFull(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}

