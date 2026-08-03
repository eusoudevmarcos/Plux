import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requireAuraAdmin } from "../auth/auth.service.js";
import {
  auraContractSchema,
  auraCustomerAccessSchema,
  auraCustomerCreateSchema,
  auraPaymentSchema,
  auraPlanSchema,
} from "./aura.schema.js";
import {
  createContract,
  createCustomer,
  createPayment,
  createPlan,
  getAuraSummary,
  listCustomers,
  listPlans,
  updateCustomerAccess,
} from "./aura.service.js";

export async function auraRoutes(app: FastifyInstance) {
  app.get("/summary", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      return getAuraSummary();
    } catch (error) {
      return reply.code(403).send({ message: error instanceof Error ? error.message : "Acesso bloqueado." });
    }
  });

  app.get("/plans", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      return listPlans();
    } catch (error) {
      return reply.code(403).send({ message: error instanceof Error ? error.message : "Acesso bloqueado." });
    }
  });

  app.post("/plans", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      const input = auraPlanSchema.parse(request.body);
      return await createPlan(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.get("/customers", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      return listCustomers();
    } catch (error) {
      return reply.code(403).send({ message: error instanceof Error ? error.message : "Acesso bloqueado." });
    }
  });

  app.post("/customers", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      const input = auraCustomerCreateSchema.parse(request.body);
      return await createCustomer(input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.patch("/customers/:id/access", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      const { id } = request.params as { id?: string };
      const input = auraCustomerAccessSchema.parse(request.body);
      return await updateCustomerAccess(parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/customers/:id/contracts", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      const { id } = request.params as { id?: string };
      const input = auraContractSchema.parse(request.body);
      return await createContract(parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/customers/:id/payments", async (request, reply) => {
    try {
      await requireAuraAdmin(request);
      const { id } = request.params as { id?: string };
      const input = auraPaymentSchema.parse(request.body);
      return await createPayment(parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
