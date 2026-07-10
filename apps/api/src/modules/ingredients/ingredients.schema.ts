import { z } from "zod";

export const unitMeasureSchema = z.enum(["g", "ml", "un"]);
export const taxConfidenceSchema = z.enum(["APPROVED", "REVIEW_REQUIRED", "BLOCKED"]);

export const ingredientCreateSchema = z.object({
  name: z.string().min(2, "Informe o nome do ingrediente."),
  unitMeasure: unitMeasureSchema,
  unitCost: z.coerce.number().nonnegative("O custo unitário não pode ser negativo."),
  stockCurrent: z.coerce.number().nonnegative("O estoque atual não pode ser negativo."),
  ncm: z.string().regex(/^\d{8}$/, "NCM deve ter 8 dígitos."),
  pisCst: z.string().min(2).max(3).default("06"),
  cofinsCst: z.string().min(2).max(3).default("06"),
  icmsCst: z.string().max(3).optional().nullable(),
  icmsCsosn: z.string().max(3).optional().nullable(),
  taxBenefitCode: z.string().max(20).optional().nullable(),
  taxConfidence: taxConfidenceSchema.default("REVIEW_REQUIRED"),
  taxNotes: z.string().max(600).optional().nullable(),
  taxClassificationId: z.string().optional().nullable(),
});

export const ingredientUpdateSchema = ingredientCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Informe ao menos um campo para atualizar.",
);

export type IngredientCreateInput = z.infer<typeof ingredientCreateSchema>;
export type IngredientUpdateInput = z.infer<typeof ingredientUpdateSchema>;

