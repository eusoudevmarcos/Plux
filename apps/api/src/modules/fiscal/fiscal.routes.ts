import type { FastifyInstance } from "fastify";
import { formatZodError, parseId } from "../../lib/http.js";
import { requirePlatformAccess } from "../auth/auth.service.js";
import {
  cancelFiscalDocument,
  listFiscalDocuments,
  preparePurchaseReturnFiscalDocument,
  prepareSaleFiscalDocument,
  transmitFiscalDocument,
} from "./fiscal.service.js";
import { fiscalCancelSchema, fiscalPrepareSchema, fiscalReturnPrepareSchema } from "./fiscal.schema.js";

export async function fiscalRoutes(app: FastifyInstance) {
  app.get("/documents", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { storeId } = request.query as { storeId?: string };
      return await listFiscalDocuments(user.id, { storeId: parseId(storeId) });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao listar documentos fiscais." });
    }
  });

  app.post("/documents/nfce/sales/:saleId/prepare", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { saleId } = request.params as { saleId?: string };
      const input = fiscalPrepareSchema.parse(request.body ?? {});
      return await prepareSaleFiscalDocument(user.id, parseId(saleId), "NFCE", input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/documents/nfe/sales/:saleId/prepare", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { saleId } = request.params as { saleId?: string };
      const input = fiscalPrepareSchema.parse(request.body ?? {});
      return await prepareSaleFiscalDocument(user.id, parseId(saleId), "NFE", input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/documents/nfe/purchases/:purchaseId/return/prepare", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { purchaseId } = request.params as { purchaseId?: string };
      const input = fiscalReturnPrepareSchema.parse(request.body ?? {});
      return await preparePurchaseReturnFiscalDocument(user.id, parseId(purchaseId), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });

  app.post("/documents/:id/transmit", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      return await transmitFiscalDocument(user.id, parseId(id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Erro ao transmitir documento fiscal." });
    }
  });

  app.post("/documents/:id/cancel", async (request, reply) => {
    try {
      const user = await requirePlatformAccess(request);
      const { id } = request.params as { id?: string };
      const input = fiscalCancelSchema.parse(request.body ?? {});
      return await cancelFiscalDocument(user.id, parseId(id), input);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : formatZodError(error) });
    }
  });
}
