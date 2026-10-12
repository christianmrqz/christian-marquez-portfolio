import type { ApplyResult, Order, ProcessResult, Proposal, Seed } from "./types";

const ENDPOINT = "/api/erp";
const TIMEOUT_MS = 15_000;

export class ErpError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** Petición al servicio con tiempo límite: la interfaz nunca se queda esperando indefinidamente. */
async function request<T>(op: string, init?: { method?: "GET" | "POST"; body?: unknown; query?: Record<string, string> }): Promise<T> {
  const params = new URLSearchParams({ op, ...init?.query });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${params}`, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    const timeout = error instanceof DOMException && error.name === "AbortError";
    throw new ErpError(timeout ? "El servicio ha tardado demasiado en responder." : "No se puede conectar con el servicio de procesamiento.", timeout ? "timeout" : "offline");
  } finally {
    clearTimeout(timer);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = data?.error;
    if (!error && response.status >= 500) throw new ErpError("El servicio de procesamiento no está disponible.", "offline", response.status);
    throw new ErpError(error?.message ?? `Error ${response.status}`, error?.code ?? "unknown", response.status);
  }
  return data as T;
}

/** Fecha local del visitante en AAAA-MM-DD: «mañana» o «el viernes» se resuelven en su calendario. */
export function localToday(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const erpClient = {
  seed: (today: string) => request<Seed>("seed", { query: { today } }),
  process: (text: string, today: string, orders: Order[]) => request<ProcessResult>("process", { method: "POST", body: { text, today, orders } }),
  apply: (proposal: Proposal, orders: Order[]) => request<ApplyResult>("apply", { method: "POST", body: { proposal, orders } }),
};
