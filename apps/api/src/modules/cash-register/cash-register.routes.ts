import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requirePlatformAccess } from "../auth/auth.service.js";
import {
  cashMovementSchema,
  cashRegisterCloseSchema,
  cashRegisterOpenSchema,
} from "./cash-register.schema.js";
import {
  closeCashRegister,
  createCashMovement,
  getCurrentCashRegister,
  openCashRegister,
} from "./cash-register.service.js";

export async function cashRegisterRoutes(app: FastifyInstance) {
  app.get("/current", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await getCurrentCashRegister(user.id, parseId(storeId));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao buscar caixa." });
    }
  });

  app.post("/open", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const input = cashRegisterOpenSchema.parse(request.body);
      return await openCashRegister(user.id, input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/:id/movements", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      const input = cashMovementSchema.parse(request.body);
      return await createCashMovement(user.id, parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/:id/close", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      const input = cashRegisterCloseSchema.parse(request.body);
      return await closeCashRegister(user.id, parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
