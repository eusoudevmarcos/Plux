import type { FastifyInstance } from "fastify";
import { formatZodError } from "../../lib/http.js";
import { companyProfileSchema } from "./company.schema.js";
import { getCompanyProfile, upsertCompanyProfile } from "./company.service.js";

export async function companyRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return getCompanyProfile();
  });

  app.put("/", async (request, reply) => {
    try {
      const input = companyProfileSchema.parse(request.body);
      return await upsertCompanyProfile(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
