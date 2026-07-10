import { apiFetch } from "@/lib/api";
import type { Product, ProductCreateResponse } from "../types";
import type { ProductWizardValues } from "../schemas/product.schema";

function normalizeProductPayload(values: ProductWizardValues) {
  return {
    ...values,
    fiscal: {
      ...values.fiscal,
      taxClassificationId: values.fiscal.taxClassificationId || null,
      preparationFeeTaxClassificationId: values.fiscal.preparationFeeTaxClassificationId || null,
      legalBasis: values.fiscal.legalBasis || null,
    },
  };
}

export function getProducts() {
  return apiFetch<Product[]>("/products");
}

export function createFullProduct(values: ProductWizardValues) {
  return apiFetch<ProductCreateResponse>("/products/create-full", {
    method: "POST",
    body: JSON.stringify(normalizeProductPayload(values)),
  });
}

