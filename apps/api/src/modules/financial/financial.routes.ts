import type { FastifyInstance } from "fastify";
import { getProductFinancialReport } from "./financial.service.js";

export async function financialRoutes(app: FastifyInstance) {
  app.get("/product-report", async (request) => {
    const { storeId } = request.query as { storeId?: string };
    return getProductFinancialReport({ storeId });
  });
}
