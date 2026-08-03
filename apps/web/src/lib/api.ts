const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const token = typeof window !== "undefined" ? window.localStorage.getItem("plux_auth_token") : null;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("API indisponível. Confirme se o Fastify está rodando ou ajuste NEXT_PUBLIC_API_URL.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Erro ao comunicar com a API.");
  }

  return response.json() as Promise<T>;
}
