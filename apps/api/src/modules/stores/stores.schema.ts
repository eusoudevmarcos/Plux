import { z } from "zod";

export const storeTaxRegimeSchema = z.enum(["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"]);

export const storeCreateSchema = z.object({
  legalName: z.string().min(2, "Informe a razao social."),
  tradeName: z.string().min(2, "Informe o nome da loja."),
  document: z.string().max(20).optional().nullable(),
  taxRegime: storeTaxRegimeSchema.default("SIMPLES"),
  state: z.string().length(2, "UF deve ter 2 letras.").default("DF"),
  city: z.string().min(2, "Informe a cidade."),
  district: z.string().min(2, "Informe o bairro."),
  addressLine: z.string().min(2, "Informe o endereco."),
  addressNumber: z.string().min(1, "Informe o numero."),
  addressComplement: z.string().max(120).optional().nullable(),
  zipCode: z.string().max(12).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export const storeUpdateSchema = storeCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Informe ao menos um campo para atualizar.",
);

export type StoreCreateInput = z.infer<typeof storeCreateSchema>;
export type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;
