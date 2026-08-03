import { z } from "zod";

export const taxAssistantScopeSchema = z.enum(["INGREDIENT", "PRODUCT"]);

export const taxAssistantSuggestSchema = z.object({
  scope: taxAssistantScopeSchema.default("INGREDIENT"),
  name: z.string().min(2, "Informe a nomenclatura."),
  category: z.string().optional().nullable(),
  ingredientNames: z.array(z.string()).optional().default([]),
});

export type TaxAssistantSuggestInput = z.infer<typeof taxAssistantSuggestSchema>;
