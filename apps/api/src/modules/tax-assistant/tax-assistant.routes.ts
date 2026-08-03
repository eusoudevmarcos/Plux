import type { FastifyInstance } from "fastify";
import { formatZodError } from "../../lib/http.js";
import { taxAssistantSuggestSchema } from "./tax-assistant.schema.js";
import { suggestTax } from "./tax-assistant.service.js";

export async function taxAssistantRoutes(app: FastifyInstance) {
  app.post("/suggest", async (request, reply) => {
    try {
      const input = taxAssistantSuggestSchema.parse(request.body);
      return await suggestTax(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
