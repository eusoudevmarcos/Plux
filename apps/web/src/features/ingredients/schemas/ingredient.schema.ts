import { z } from "zod";

export const ingredientFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatório."),
  unitMeasure: z.enum(["g", "ml", "un"]),
  unitCost: z.coerce.number().nonnegative("Custo inválido."),
  stockCurrent: z.coerce.number().nonnegative("Estoque inválido."),
  ncm: z.string().regex(/^\d{8}$/, "NCM deve ter 8 dígitos."),
  pisCst: z.string().min(2).max(3),
  cofinsCst: z.string().min(2).max(3),
  icmsCst: z.string().max(3).optional().or(z.literal("")),
  icmsCsosn: z.string().max(3).optional().or(z.literal("")),
  taxBenefitCode: z.string().max(20).optional().or(z.literal("")),
  taxConfidence: z.enum(["APPROVED", "REVIEW_REQUIRED", "BLOCKED"]),
  taxClassificationId: z.string().optional().or(z.literal("")),
  taxNotes: z.string().max(600).optional().or(z.literal("")),
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

