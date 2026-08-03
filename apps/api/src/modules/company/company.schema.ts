import { z } from "zod";

export const companyTaxRegimeSchema = z.enum(["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"]);

export const companyProfileSchema = z.object({
  legalName: z.string().min(2, "Informe a razao social."),
  tradeName: z.string().max(140).optional().nullable(),
  document: z.string().max(20).optional().nullable(),
  taxRegime: companyTaxRegimeSchema.default("SIMPLES"),
  uf: z.string().length(2, "UF deve ter 2 letras.").default("DF"),
  city: z.string().max(120).optional().nullable(),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
