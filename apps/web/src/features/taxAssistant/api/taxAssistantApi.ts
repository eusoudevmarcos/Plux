import { apiFetch } from "@/lib/api";
import type { TaxAssistantSuggestion } from "../types";

export function suggestIngredientTax(name: string) {
  return apiFetch<TaxAssistantSuggestion>("/tax-assistant/suggest", {
    method: "POST",
    body: JSON.stringify({
      scope: "INGREDIENT",
      name,
    }),
  });
}

export function suggestProductTax(input: { name: string; category?: string; ingredientNames?: string[] }) {
  return apiFetch<TaxAssistantSuggestion>("/tax-assistant/suggest", {
    method: "POST",
    body: JSON.stringify({
      scope: "PRODUCT",
      ...input,
    }),
  });
}
