/**
 * Estado del panel: reducer puro y selectores. Sin React: se prueba con Vitest (state.test.ts).
 */
import { normalize } from "@/lib/commands";
import { PRIORITIES, STATUSES, type Assignee, type Priority, type Scenario, type Status, type Ticket } from "./data";

export type SortKey = "id" | "subject" | "customer" | "status" | "priority" | "updatedDaysAgo";
export type View = "tabla" | "tarjetas";
export type Theme = "papel" | "grafito" | "contraste";
export type Density = "comoda" | "compacta";

export type State = {
  load: { status: "loading" } | { status: "ready" } | { status: "error"; message: string };
  tickets: Ticket[];
  query: string;
  statusFilter: Status | "todas";
  priorityFilter: Priority | "todas";
  sort: { key: SortKey; dir: "asc" | "desc" };
  view: View;
  theme: Theme;
  density: Density;
  scenario: Scenario;
  editingId: string | null;
  lastSavedId: string | null;
};

export type TicketPatch = Pick<Ticket, "subject" | "status" | "priority" | "assignee">;

export type Action =
  | { type: "load/start" }
  | { type: "load/success"; tickets: Ticket[] }
  | { type: "load/failure"; message: string }
  | { type: "query"; value: string }
  | { type: "filter/status"; value: State["statusFilter"] }
  | { type: "filter/priority"; value: State["priorityFilter"] }
  | { type: "filters/clear" }
  | { type: "sort"; key: SortKey }
  | { type: "view"; value: View }
  | { type: "theme"; value: Theme }
  | { type: "density"; value: Density }
  | { type: "scenario"; value: Scenario }
  | { type: "edit/start"; id: string }
  | { type: "edit/cancel" }
  | { type: "edit/save"; id: string; patch: TicketPatch };

export const initialState: State = {
  load: { status: "loading" },
  tickets: [],
  query: "",
  statusFilter: "todas",
  priorityFilter: "todas",
  sort: { key: "priority", dir: "desc" },
  view: "tabla",
  theme: "papel",
  density: "comoda",
  scenario: "normal",
  editingId: null,
  lastSavedId: null,
};

// region: reducer
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "load/start":
      return { ...state, load: { status: "loading" } };
    case "load/success":
      return { ...state, load: { status: "ready" }, tickets: action.tickets };
    case "load/failure":
      return { ...state, load: { status: "error", message: action.message }, tickets: [] };
    case "query":
      return { ...state, query: action.value };
    case "filter/status":
      return { ...state, statusFilter: action.value };
    case "filter/priority":
      return { ...state, priorityFilter: action.value };
    case "filters/clear":
      return { ...state, query: "", statusFilter: "todas", priorityFilter: "todas" };
    case "sort":
      // Misma columna: invierte el sentido. Columna nueva: ascendente (salvo prioridad, que empieza por la más alta).
      return state.sort.key === action.key
        ? { ...state, sort: { key: action.key, dir: state.sort.dir === "asc" ? "desc" : "asc" } }
        : { ...state, sort: { key: action.key, dir: action.key === "priority" ? "desc" : "asc" } };
    case "view":
      return { ...state, view: action.value };
    case "theme":
      return { ...state, theme: action.value };
    case "density":
      return { ...state, density: action.value };
    case "scenario":
      return { ...state, scenario: action.value };
    case "edit/start":
      return { ...state, editingId: action.id };
    case "edit/cancel":
      return { ...state, editingId: null };
    case "edit/save": {
      if (Object.keys(validatePatch(action.patch)).length) return state;
      return {
        ...state,
        editingId: null,
        lastSavedId: action.id,
        tickets: state.tickets.map((t) => (t.id === action.id ? { ...t, ...action.patch, subject: action.patch.subject.trim(), updatedDaysAgo: 0 } : t)),
      };
    }
  }
}
// endregion

/** Reglas del formulario de edición. Se usan en el formulario (mensajes) y en el reducer (no guarda datos inválidos). */
export function validatePatch(patch: TicketPatch): Partial<Record<keyof TicketPatch, string>> {
  const errors: Partial<Record<keyof TicketPatch, string>> = {};
  const subject = patch.subject.trim();
  if (subject.length < 5) errors.subject = "El asunto debe tener al menos 5 caracteres.";
  else if (subject.length > 120) errors.subject = "El asunto no puede superar 120 caracteres.";
  if (patch.status === "resuelta" && patch.assignee === "Sin asignar") errors.assignee = "Una incidencia resuelta necesita un responsable.";
  if (patch.priority === "critica" && patch.assignee === "Sin asignar" && patch.status !== "resuelta") errors.assignee = "Las incidencias críticas deben tener responsable.";
  return errors;
}

const ORDER: Record<string, readonly string[]> = { status: STATUSES, priority: PRIORITIES };

function compare(a: Ticket, b: Ticket, key: SortKey) {
  const order = ORDER[key];
  if (order) return order.indexOf(a[key as "status"]) - order.indexOf(b[key as "status"]);
  if (key === "updatedDaysAgo") return a.updatedDaysAgo - b.updatedDaysAgo;
  return a[key].localeCompare(b[key], "es", { numeric: true });
}

// region: selectores
/** Incidencias visibles: búsqueda sin tildes en asunto, cliente e id; filtros; orden estable con desempate por id. */
export function selectVisible(state: Pick<State, "tickets" | "query" | "statusFilter" | "priorityFilter" | "sort">): Ticket[] {
  const terms = normalize(state.query).split(/\s+/).filter(Boolean);
  const direction = state.sort.dir === "asc" ? 1 : -1;
  return state.tickets
    .filter((t) => state.statusFilter === "todas" || t.status === state.statusFilter)
    .filter((t) => state.priorityFilter === "todas" || t.priority === state.priorityFilter)
    .filter((t) => {
      const haystack = normalize(`${t.id} ${t.subject} ${t.customer} ${t.assignee}`);
      return terms.every((term) => haystack.includes(term));
    })
    .sort((a, b) => compare(a, b, state.sort.key) * direction || a.id.localeCompare(b.id));
}

export function selectSummary(tickets: Ticket[]) {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const t of tickets) byStatus[t.status]++;
  const openCritical = tickets.filter((t) => t.priority === "critica" && t.status !== "resuelta").length;
  const unassigned = tickets.filter((t) => t.assignee === "Sin asignar" && t.status !== "resuelta").length;
  return { total: tickets.length, byStatus, openCritical, unassigned };
}
// endregion

export function hasActiveFilters(state: Pick<State, "query" | "statusFilter" | "priorityFilter">) {
  return state.query.trim() !== "" || state.statusFilter !== "todas" || state.priorityFilter !== "todas";
}

export type { Assignee };
