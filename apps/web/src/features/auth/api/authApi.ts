import { apiFetch } from "@/lib/api";
import type { AuthResponse, LoginInput, RegisterInput } from "../types";

export function login(values: LoginInput) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function register(values: RegisterInput) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function logout() {
  return apiFetch<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
  });
}
