import type { Store } from "./types";

const ACTIVE_STORE_ID_KEY = "plux_active_store_id";
const ACTIVE_STORE_KEY = "plux_active_store";

export function setActiveStore(store: Store) {
  window.localStorage.setItem(ACTIVE_STORE_ID_KEY, store.id);
  window.localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(store));
}

export function getActiveStoreId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_STORE_ID_KEY);
}

export function getActiveStore(): Store | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ACTIVE_STORE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Store;
  } catch {
    return null;
  }
}

export function clearActiveStore() {
  window.localStorage.removeItem(ACTIVE_STORE_ID_KEY);
  window.localStorage.removeItem(ACTIVE_STORE_KEY);
}
