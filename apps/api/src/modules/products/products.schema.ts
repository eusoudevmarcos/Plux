import { z } from "zod";

export const fiscalStrategySchema = z.enum([
  "COMBINED_FOOD_SERVICE",
  "SPLIT_INGREDIENTS_PREPARATION_FEE",
]);

export const taxRegimeSchema = z.enum(["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"]);

export const productFiscalSchema = z.object({
  uf: z.string().length(2).default("DF"),
  taxRegime: taxRegimeSchema.default("SIMPLES"),
  ncm: z.string().regex(/^\d{8}$/, "NCM do produto deve ter 8 dígitos."),
  csosn: z.string().min(3).max(3),
  pisCst: z.string().min(2).max(3),
  cofinsCst: z.string().min(2).max(3),
  taxClassificationId: z.string().optional().nullable(),
  cClassTrib: z.string().regex(/^\d{6}$/).optional().nullable(),
  cstIbsCbs: z.string().regex(/^\d{3}$/).optional().nullable(),
  preparationFeeNcm: z.string().regex(/^\d{8}$/).default("21069090"),
  preparationFeeTaxClassificationId: z.string().optional().nullable(),
  preparationFeeCClassTrib: z.string().regex(/^\d{6}$/).optional().nullable(),
  preparationFeeCstIbsCbs: z.string().regex(/^\d{3}$/).optional().nullable(),
  legalBasis: z.string().max(900).optional().nullable(),
  requiresLegalReview: z.coerce.boolean().default(true),
});

export const productCreateFullSchema = z.object({
  name: z.string().min(2, "Informe o nome do produto."),
  sku: z.string().min(3, "Informe um SKU."),
  category: z.string().min(2, "Informe a categoria."),
  salePrice: z.coerce.number().nonnegative("Preço de venda não pode ser negativo."),
  active: z.coerce.boolean().default(true),
  preparationFee: z.coerce.number().nonnegative().default(5),
  fiscalStrategy: fiscalStrategySchema.default("SPLIT_INGREDIENTS_PREPARATION_FEE"),
  composition: z
    .array(
      z.object({
        ingredientId: z.string().min(1),
        qtyUsed: z.coerce.number().positive("Quantidade usada deve ser maior que zero."),
      }),
    )
    .min(1, "Produto precisa ter pelo menos um ingrediente."),
  fiscal: productFiscalSchema,
});

export type ProductCreateFullInput = z.infer<typeof productCreateFullSchema>;

