import cors from "@fastify/cors";
import type { FastifyCorsOptions } from "@fastify/cors";
import Fastify from "fastify";
import { ingredientsRoutes } from "./modules/ingredients/ingredients.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { taxClassificationsRoutes } from "./modules/tax/tax-classifications.routes.js";

function wildcardToRegExp(pattern: string) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function buildCorsOrigin(): FastifyCorsOptions["origin"] {
  const origins = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];

  if (origins.length === 0 || origins.includes("*")) {
    return true;
  }

  const exactOrigins = origins.filter((origin) => !origin.includes("*"));
  const wildcardOrigins = origins.filter((origin) => origin.includes("*")).map(wildcardToRegExp);

  return async (origin: string | undefined) => {
    if (!origin) {
      return true;
    }

    return exactOrigins.includes(origin) || wildcardOrigins.some((pattern) => pattern.test(origin));
  };
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: buildCorsOrigin(),
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "pluxsales-api",
      timestamp: new Date().toISOString(),
    };
  });

  await app.register(ingredientsRoutes, { prefix: "/ingredients" });
  await app.register(productsRoutes, { prefix: "/products" });
  await app.register(taxClassificationsRoutes, { prefix: "/tax-classifications" });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return reply.code(500).send({ message: "Erro interno da API." });
  });

  return app;
}
