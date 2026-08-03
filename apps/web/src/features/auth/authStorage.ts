import type { AuthResponse, AuthUser } from "./types";

const TOKEN_KEY = "plux_auth_token";
const USER_KEY = "plux_auth_user";

export function saveAuthSession(session: AuthResponse) {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function saveAuthUser(user: AuthUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem("plux_active_store_id");
  window.localStorage.removeItem("plux_active_store");
}
