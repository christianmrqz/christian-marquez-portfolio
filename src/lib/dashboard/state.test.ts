import { describe, expect, it } from "vitest";
import { SAMPLE_TICKETS } from "./data";
import { hasActiveFilters, initialState, reducer, selectSummary, selectVisible, validatePatch, type State } from "./state";

const ready: State = reducer(initialState, { type: "load/success", tickets: SAMPLE_TICKETS });
const ids = (s: State) => selectVisible(s).map((t) => t.id);

describe("búsqueda y filtros", () => {
  it("busca sin tildes ni mayúsculas en asunto, cliente e id", () => {
    expect(ids(reducer(ready, { type: "query", value: "sincroniz" }))).toEqual(["INC-2046", "INC-2056"]);
    expect(ids(reducer(ready, { type: "query", value: "inc-2041" }))).toEqual(["INC-2041"]);
    expect(selectVisible(reducer(ready, { type: "query", value: "ALAMEDA" })).every((t) => t.customer === "Ferretería Alameda")).toBe(true);
  });

  it("combina todas las palabras de la búsqueda", () => {
    expect(ids(reducer(ready, { type: "query", value: "ribera factura" }))).toEqual(["INC-2041"]);
  });

  it("combina filtros de estado y prioridad", () => {
    let s = reducer(ready, { type: "filter/status", value: "abierta" });
    s = reducer(s, { type: "filter/priority", value: "critica" });
    expect(ids(s)).toEqual(["INC-2046"]);
    expect(hasActiveFilters(s)).toBe(true);
    expect(hasActiveFilters(reducer(s, { type: "filters/clear" }))).toBe(false);
  });

  it("devuelve una lista vacía cuando nada coincide", () => {
    expect(ids(reducer(ready, { type: "query", value: "zzz" }))).toEqual([]);
  });
});

describe("orden", () => {
  it("ordena por prioridad de mayor a menor por defecto, con desempate estable por id", () => {
    const visible = selectVisible(ready);
    expect(visible[0]!.priority).toBe("critica");
    expect(visible.at(-1)!.priority).toBe("baja");
    const criticals = visible.filter((t) => t.priority === "critica").map((t) => t.id);
    expect(criticals).toEqual([...criticals].sort());
  });

  it("la misma columna invierte el sentido; una nueva empieza ascendente", () => {
    const byCustomer = reducer(ready, { type: "sort", key: "customer" });
    expect(byCustomer.sort).toEqual({ key: "customer", dir: "asc" });
    expect(selectVisible(byCustomer)[0]!.customer).toBe("Clínica Dental Sur");
    expect(reducer(byCustomer, { type: "sort", key: "customer" }).sort.dir).toBe("desc");
  });

  it("ordena el estado según el flujo de trabajo, no alfabéticamente", () => {
    const s = reducer(ready, { type: "sort", key: "status" });
    const statuses = selectVisible(s).map((t) => t.status);
    expect(statuses[0]).toBe("abierta");
    expect(statuses.at(-1)).toBe("resuelta");
  });
});

describe("edición", () => {
  const patch = { subject: "Factura duplicada en octubre (abono emitido)", status: "resuelta", priority: "media", assignee: "Lucía" } as const;

  it("guarda el cambio, lo marca como reciente y cierra el editor", () => {
    const s = reducer(reducer(ready, { type: "edit/start", id: "INC-2041" }), { type: "edit/save", id: "INC-2041", patch });
    const ticket = s.tickets.find((t) => t.id === "INC-2041")!;
    expect(ticket).toMatchObject({ ...patch, updatedDaysAgo: 0 });
    expect(s.editingId).toBeNull();
    expect(s.lastSavedId).toBe("INC-2041");
    expect(selectSummary(s.tickets).byStatus.resuelta).toBe(selectSummary(ready.tickets).byStatus.resuelta + 1);
  });

  it("no guarda datos que incumplen las reglas", () => {
    const invalid = { ...patch, assignee: "Sin asignar" } as const;
    expect(validatePatch(invalid).assignee).toMatch(/responsable/);
    expect(reducer(ready, { type: "edit/save", id: "INC-2041", patch: invalid })).toBe(ready);
    expect(validatePatch({ ...patch, subject: "  ok " }).subject).toBeDefined();
    expect(validatePatch({ ...patch, status: "abierta", priority: "critica", assignee: "Sin asignar" }).assignee).toMatch(/críticas/);
  });
});

describe("carga y resumen", () => {
  it("un error de carga vacía los datos y conserva el mensaje", () => {
    const s = reducer(ready, { type: "load/failure", message: "503" });
    expect(s.load).toEqual({ status: "error", message: "503" });
    expect(s.tickets).toEqual([]);
  });

  it("resume estados, críticas abiertas y sin asignar", () => {
    const summary = selectSummary(SAMPLE_TICKETS);
    expect(summary.total).toBe(18);
    expect(Object.values(summary.byStatus).reduce((a, b) => a + b)).toBe(18);
    expect(summary.openCritical).toBe(3);
    expect(summary.unassigned).toBe(4);
  });
});
