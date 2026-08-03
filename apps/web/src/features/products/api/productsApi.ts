import { apiFetch } from "@/lib/api";
import { getActiveStoreId } from "@/features/stores/activeStore";
import type { Product, ProductCreateResponse } from "../types";
import type { ProductWizardValues } from "../schemas/product.schema";

function normalizeProductPayload(values: ProductWizardValues) {
  const storeId = getActiveStoreId();

  return {
    ...values,
    storeId,
    fiscal: {
      ...values.fiscal,
      taxClassificationId: values.fiscal.taxClassificationId || null,
      preparationFeeTaxClassificationId: values.fiscal.preparationFeeTaxClassificationId || null,
      legalBasis: values.fiscal.legalBasis || null,
    },
  };
}

export function getProducts() {
  const storeId = getActiveStoreId();
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";

  return apiFetch<Product[]>(`/products${query}`);
}

export function updateProductActive(id: string, active: boolean) {
  return apiFetch<Product>(`/products/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function createFullProduct(values: ProductWizardValues) {
  return apiFetch<ProductCreateResponse>("/products/create-full", {
    method: "POST",
    body: JSON.stringify(normalizeProductPayload(values)),
  });
}
