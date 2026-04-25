const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type HttpMethod = "GET" | "POST";

export async function apiRequest<T>(path: string, method: HttpMethod, body?: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro inesperado" }));
    throw new Error(error.message ?? "Erro inesperado");
  }

  return response.json() as Promise<T>;
}
