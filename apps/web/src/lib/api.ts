const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

function friendlyHttpMessage(status: number, payload?: { message?: string; requestId?: string } | null) {
  const suffix = payload?.requestId ? ` Codigo: ${payload.requestId}.` : "";

  if (payload?.message) {
    return `${payload.message}${suffix}`;
  }

  if (status === 401) return "Sessao expirada. Faça login novamente.";
  if (status === 403) return "Acesso bloqueado para este recurso.";
  if (status === 404) return "Registro nao encontrado.";
  if (status >= 500) return `Instabilidade na API. Tente novamente em instantes.${suffix}`;

  return "Erro ao comunicar com a API.";
}

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
    const payload = (await response.json().catch(() => null)) as { message?: string; requestId?: string } | null;
    throw new Error(friendlyHttpMessage(response.status, payload));
  }

  return response.json() as Promise<T>;
}
