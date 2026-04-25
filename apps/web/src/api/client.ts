const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type HttpMethod = "GET" | "POST";

export type RoutinePayload = {
  hunger: number;
  thirst: number;
  sleep: number;
  energy: number;
  routineUpdatedAt: string;
  lastWorkAt: string | null;
  workStreak: number;
  statusLabels: string[];
  canWork: boolean;
};

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

export function getRoutineMe(token: string) {
  return apiRequest<RoutinePayload>("/routine/me", "GET", undefined, token);
}

export function postRoutineEat(token: string) {
  return apiRequest<RoutinePayload>("/routine/eat", "POST", {}, token);
}

export function postRoutineDrink(token: string) {
  return apiRequest<RoutinePayload>("/routine/drink", "POST", {}, token);
}

export function postRoutineRest(token: string) {
  return apiRequest<RoutinePayload>("/routine/rest", "POST", {}, token);
}

export function postRoutineWork(token: string) {
  return apiRequest<RoutinePayload>("/routine/work", "POST", {}, token);
}
