import { apiFetch } from "@/lib/api";
import type { Ingredient } from "../types";
import type { IngredientFormValues } from "../schemas/ingredient.schema";

function normalizeIngredientPayload(values: IngredientFormValues) {
  return {
    ...values,
    taxClassificationId: values.taxClassificationId || null,
    icmsCst: values.icmsCst || null,
    icmsCsosn: values.icmsCsosn || null,
    taxBenefitCode: values.taxBenefitCode || null,
    taxNotes: values.taxNotes || null,
  };
}

export function getIngredients() {
  return apiFetch<Ingredient[]>("/ingredients");
}

export function createIngredient(values: IngredientFormValues) {
  return apiFetch<Ingredient>("/ingredients", {
    method: "POST",
    body: JSON.stringify(normalizeIngredientPayload(values)),
  });
}

export function deleteIngredient(id: string) {
  return apiFetch<{ deleted: true }>(`/ingredients/${id}`, {
    method: "DELETE",
  });
}

