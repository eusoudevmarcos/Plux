import { z } from "zod";

export const productWizardSchema = z.object({
  name: z.string().min(2, "Nome obrigatório."),
  sku: z.string().min(3, "SKU obrigatório."),
  category: z.string().min(2, "Categoria obrigatória."),
  salePrice: z.coerce.number().nonnegative("Preço inválido."),
  active: z.boolean().default(true),
  preparationFee: z.coerce.number().nonnegative("Taxa inválida."),
  fiscalStrategy: z.enum(["COMBINED_FOOD_SERVICE", "SPLIT_INGREDIENTS_PREPARATION_FEE"]),
  composition: z
    .array(
      z.object({
        ingredientId: z.string().min(1, "Selecione o ingrediente."),
        qtyUsed: z.coerce.number().positive("Quantidade inválida."),
      }),
    )
    .min(1, "Adicione ao menos um ingrediente."),
  fiscal: z.object({
    uf: z.string().length(2, "UF inválida."),
    taxRegime: z.enum(["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"]),
    ncm: z.string().regex(/^\d{8}$/, "NCM deve ter 8 dígitos."),
    csosn: z.string().length(3, "CSOSN inválido."),
    pisCst: z.string().min(2).max(3),
    cofinsCst: z.string().min(2).max(3),
    taxClassificationId: z.string().optional().or(z.literal("")),
    preparationFeeNcm: z.string().regex(/^\d{8}$/, "NCM da taxa deve ter 8 dígitos."),
    preparationFeeTaxClassificationId: z.string().optional().or(z.literal("")),
    legalBasis: z.string().max(900).optional().or(z.literal("")),
    requiresLegalReview: z.boolean().default(true),
  }),
});

export type ProductWizardValues = z.infer<typeof productWizardSchema>;

