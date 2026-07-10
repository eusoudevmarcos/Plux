import type { FastifyInstance } from "fastify";
import { listTaxClassifications } from "./tax-classifications.service.js";

export async function taxClassificationsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return listTaxClassifications();
  });
}

