import { z } from "zod";

export const fiscalEnvironmentSchema = z.enum(["HOMOLOGATION", "PRODUCTION"]).default("HOMOLOGATION");

export const fiscalPrepareSchema = z.object({
  storeId: z.string().min(1).optional(),
  environment: fiscalEnvironmentSchema,
  series: z.string().trim().min(1).max(3).default("1"),
});

export const fiscalReturnPrepareSchema = fiscalPrepareSchema.extend({
  reason: z.string().trim().min(5).max(500).default("Devolucao de mercadoria preparada pela Plux."),
});

export const fiscalCancelSchema = z.object({
  reason: z.string().trim().min(15).max(255),
});

export type FiscalPrepareInput = z.infer<typeof fiscalPrepareSchema>;
export type FiscalReturnPrepareInput = z.infer<typeof fiscalReturnPrepareSchema>;
export type FiscalCancelInput = z.infer<typeof fiscalCancelSchema>;
