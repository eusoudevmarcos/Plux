import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { createProductFull, getProductById, listProducts, updateProductActive } from "./products.service.js";
import { productActiveUpdateSchema, productCreateFullSchema } from "./products.schema.js";

export async function productsRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const { storeId } = request.query as { storeId?: string };
    return listProducts({ storeId });
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id?: string };
    const product = await getProductById(parseId(id));

    if (!product) {
      return reply.code(404).send({ message: "Produto não encontrado." });
    }

    return product;
  });

  app.patch("/:id/active", async (request, reply) => {
    try {
      const { id } = request.params as { id?: string };
      const input = productActiveUpdateSchema.parse(request.body);
      return await updateProductActive(parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
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
