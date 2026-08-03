import { apiFetch } from "@/lib/api";
import type { Store, StoreInput } from "../types";

export function getStores() {
  return apiFetch<Store[]>("/stores");
}

export function getStore(id: string) {
  return apiFetch<Store>(`/stores/${id}`);
}

export function createStore(values: StoreInput) {
  return apiFetch<Store>("/stores", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateStore(id: string, values: Partial<StoreInput>) {
  return apiFetch<Store>(`/stores/${id}`, {
    method: "PUT",
    body: JSON.stringify(values),
  });
}
