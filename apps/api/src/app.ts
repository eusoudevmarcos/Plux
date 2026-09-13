import cors from "@fastify/cors";
import type { FastifyCorsOptions } from "@fastify/cors";
import Fastify from "fastify";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { auraRoutes } from "./modules/aura/aura.routes.js";
import { cashRegisterRoutes } from "./modules/cash-register/cash-register.routes.js";
import { companyRoutes } from "./modules/company/company.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { fiscalRoutes } from "./modules/fiscal/fiscal.routes.js";
import { financialRoutes } from "./modules/financial/financial.routes.js";
import { ingredientsRoutes } from "./modules/ingredients/ingredients.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { purchasesRoutes } from "./modules/purchases/purchases.routes.js";
import { salesRoutes } from "./modules/sales/sales.routes.js";
import { stockRoutes } from "./modules/stock/stock.routes.js";
import { storesRoutes } from "./modules/stores/stores.routes.js";
import { suppliersRoutes } from "./modules/suppliers/suppliers.routes.js";
import { systemRoutes } from "./modules/system/system.routes.js";
import { taxAssistantRoutes } from "./modules/tax-assistant/tax-assistant.routes.js";
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

function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Can't reach database")
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function getErrorStatusCode(error: unknown) {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const statusCode = Number((error as { statusCode?: unknown }).statusCode);
    return statusCode >= 400 ? statusCode : 500;
  }

  return 500;
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

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(auraRoutes, { prefix: "/aura" });
  await app.register(cashRegisterRoutes, { prefix: "/cash-register" });
  await app.register(companyRoutes, { prefix: "/company-profile" });
  await app.register(dashboardRoutes, { prefix: "/dashboard" });
  await app.register(fiscalRoutes, { prefix: "/fiscal" });
  await app.register(financialRoutes, { prefix: "/financial" });
  await app.register(ingredientsRoutes, { prefix: "/ingredients" });
  await app.register(productsRoutes, { prefix: "/products" });
  await app.register(purchasesRoutes, { prefix: "/purchases" });
  await app.register(salesRoutes, { prefix: "/sales" });
  await app.register(stockRoutes, { prefix: "/stock" });
  await app.register(storesRoutes, { prefix: "/stores" });
  await app.register(suppliersRoutes, { prefix: "/suppliers" });
  await app.register(systemRoutes, { prefix: "/system" });
  await app.register(taxAssistantRoutes, { prefix: "/tax-assistant" });
  await app.register(taxClassificationsRoutes, { prefix: "/tax-classifications" });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (isDatabaseUnavailableError(error)) {
      return reply.code(503).send({
        message:
          "Banco de dados indisponível. Configure DATABASE_URL para um PostgreSQL ativo ou suba o Postgres local.",
        requestId: request.id,
      });
    }

    const statusCode = getErrorStatusCode(error);
    const fallbackMessage =
      statusCode >= 500
        ? "Erro interno da API. Tente novamente e informe o codigo de atendimento se persistir."
        : "Nao foi possivel concluir a solicitacao.";

    return reply.code(statusCode).send({
      message: process.env.NODE_ENV === "production" ? fallbackMessage : getErrorMessage(error) || fallbackMessage,
      requestId: request.id,
    });
  });

  return app;
}
