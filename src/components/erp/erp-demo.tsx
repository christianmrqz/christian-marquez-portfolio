"use client";

import { useCallback, useEffect, useId, useReducer, useRef } from "react";
import { ErpError, erpClient, localToday } from "@/lib/erp/client";
import { STATE_LABELS, type ApplyResult, type Order, type ProcessResult, type Product } from "@/lib/erp/types";

/* ---------- Ejemplos preparados (fecha relativa al día de la visita) ---------- */

function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

const EXAMPLES = [
  {
    id: "valid",
    label: "Solicitud válida",
    text: () =>
      `Hola, somos Ferretería Alameda. Para el pedido SO-1042 necesitamos 40 cajas de tornillo M6 en lugar de 25 y, si es posible, recibirlo el ${inDays(12)}. Gracias.`,
  },
  { id: "missing", label: "Información insuficiente", text: () => "Buenas, ¿podéis cambiar la cantidad del pedido? Lo necesitamos antes. Gracias." },
  { id: "locked", label: "Pedido entregado", text: () => "Pedido SO-1043 de Talleres Ribera: dejad en 12 las cajas de broca de 10 mm." },
  { id: "warning", label: "Con aviso", text: () => "Reformas Vega, pedido SO-1044: 20 cintas americanas en vez de 10, entrega el viernes." },
] as const;

/* ---------- Estado ---------- */

type State = {
  boot: "loading" | "ready" | "error";
  bootError?: string;
  orders: Order[];
  initialOrders: Order[];
  catalog: Product[];
  text: string;
  step: "idle" | "processing" | "processed" | "applying" | "applied";
  result?: ProcessResult;
  applied?: ApplyResult;
  error?: { message: string; code: string };
  changedRef?: string;
};

type Action =
  | { type: "booted"; orders: Order[]; catalog: Product[] }
  | { type: "bootFailed"; message: string }
  | { type: "retryBoot" }
  | { type: "setText"; text: string }
  | { type: "process" }
  | { type: "processed"; result: ProcessResult }
  | { type: "apply" }
  | { type: "applied"; result: ApplyResult }
  | { type: "failed"; error: { message: string; code: string } }
  | { type: "discard" }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "booted":
      return { ...state, boot: "ready", orders: action.orders, initialOrders: action.orders, catalog: action.catalog };
    case "bootFailed":
      return { ...state, boot: "error", bootError: action.message };
    case "retryBoot":
      return { ...state, boot: "loading", bootError: undefined };
    case "setText":
      return { ...state, text: action.text };
    case "process":
      return { ...state, step: "processing", error: undefined, result: undefined, applied: undefined };
    case "processed":
      return { ...state, step: "processed", result: action.result };
    case "apply":
      return { ...state, step: "applying", error: undefined };
    case "applied":
      return {
        ...state,
        step: "applied",
        applied: action.result,
        changedRef: action.result.order.ref,
        orders: state.orders.map((o) => (o.ref === action.result.order.ref ? action.result.order : o)),
      };
    case "failed":
      // Un fallo al aplicar conserva la propuesta visible; uno al procesar vuelve al inicio.
      return { ...state, step: state.step === "applying" ? "processed" : "idle", error: action.error };
    case "discard":
      return { ...state, step: "idle", result: undefined, applied: undefined, error: undefined };
    case "reset":
      return { ...state, orders: state.initialOrders, step: "idle", result: undefined, applied: undefined, error: undefined, changedRef: undefined };
  }
}

const initialState: State = { boot: "loading", orders: [], initialOrders: [], catalog: [], text: EXAMPLES[0].text(), step: "idle" };

const toError = (e: unknown) => (e instanceof ErpError ? { message: e.message, code: e.code } : { message: "Error inesperado.", code: "unknown" });

/* ---------- Componente ---------- */

export function ErpDemo() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const resultRef = useRef<HTMLDivElement>(null);
  const textId = useId();

  useEffect(() => {
    if (state.boot !== "loading") return;
    let cancelled = false;
    erpClient
      .seed(localToday())
      .then((seed) => !cancelled && dispatch({ type: "booted", orders: seed.orders, catalog: seed.catalog }))
      .catch((e) => !cancelled && dispatch({ type: "bootFailed", message: toError(e).message }));
    return () => {
      cancelled = true;
    };
  }, [state.boot]);

  const process = useCallback(async () => {
    dispatch({ type: "process" });
    try {
      const result = await erpClient.process(state.text, localToday(), state.orders);
      dispatch({ type: "processed", result });
      requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: true }));
    } catch (e) {
      dispatch({ type: "failed", error: toError(e) });
    }
  }, [state.text, state.orders]);

  const apply = useCallback(async () => {
    if (!state.result?.proposal) return;
    dispatch({ type: "apply" });
    try {
      dispatch({ type: "applied", result: await erpClient.apply(state.result.proposal, state.orders) });
    } catch (e) {
      dispatch({ type: "failed", error: toError(e) });
    }
  }, [state.result, state.orders]);

  if (state.boot !== "ready") {
    return (
      <div className="rounded-2xl border border-line bg-white p-8" role="status">
        {state.boot === "loading" ? (
          <p className="flex items-center gap-3 text-sm text-muted">
            <Spinner /> Cargando los pedidos ficticios del sandbox…
          </p>
        ) : (
          <div className="grid gap-3">
            <p className="font-medium text-err">El servicio de procesamiento no está disponible.</p>
            <p className="text-sm text-muted">
              {state.bootError} Si estás ejecutando el proyecto en local, arranca el servicio Python con <code className="font-mono">npm run dev</code>.
            </p>
            <button type="button" className="btn btn-ghost w-fit" onClick={() => dispatch({ type: "retryBoot" })}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    );
  }

  const busy = state.step === "processing" || state.step === "applying";
  const activeExample = EXAMPLES.find((ex) => ex.text() === state.text)?.id;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-12">
      {/* Paso 1: entrada */}
      <div className="grid content-start gap-6 lg:col-span-5">
        <Panel step="1" title="Solicitud del cliente">
          <fieldset>
            <legend className="text-sm text-muted">Ejemplos preparados</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  aria-pressed={activeExample === ex.id}
                  onClick={() => dispatch({ type: "setText", text: ex.text() })}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    activeExample === ex.id ? "border-[#1d4ed8] bg-[#eff4ff] text-[#1d3fb8]" : "border-[#d9dde3] hover:border-[#9aa3b2]"
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor={textId} className="mt-5 block text-sm font-medium">
            Texto (puedes editarlo)
          </label>
          <textarea
            id={textId}
            value={state.text}
            onChange={(e) => dispatch({ type: "setText", text: e.target.value })}
            maxLength={1500}
            rows={5}
            className="mt-2 w-full resize-y rounded-xl border border-[#d9dde3] bg-[#fbfcfd] p-3 text-[0.95rem] leading-relaxed outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted">{state.text.length}/1500</span>
            <button type="button" onClick={process} disabled={busy || !state.text.trim()} className="btn bg-[#1d4ed8] text-white hover:bg-[#1e40af] disabled:opacity-50">
              {state.step === "processing" ? (
                <>
                  <Spinner light /> Procesando…
                </>
              ) : (
                "Procesar solicitud"
              )}
            </button>
          </div>
          {state.error && state.step === "idle" && <Alert tone="error">{state.error.message}</Alert>}
        </Panel>

        <Panel title="Pedidos del sandbox" aside={<SimulatedBadge>Ficticios</SimulatedBadge>}>
          <OrdersTable orders={state.orders} catalog={state.catalog} changedRef={state.changedRef} />
          <button type="button" className="mt-4 text-sm text-muted underline underline-offset-2 hover:text-graphite" onClick={() => dispatch({ type: "reset" })}>
            Restablecer los pedidos
          </button>
        </Panel>
      </div>

      {/* Pasos 2-5: resultado */}
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="grid content-start gap-6 outline-none lg:col-span-7">
        {!state.result ? (
          <div className="grid min-h-72 place-content-center rounded-2xl border border-dashed border-[#d9dde3] bg-white/60 p-8 text-center">
            <p className="font-medium">El resultado aparecerá aquí, paso a paso.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Datos estructurados → validación → propuesta de cambios → confirmación. Nada se modifica hasta que confirmas.
            </p>
          </div>
        ) : (
          <Result state={state} onApply={apply} onDiscard={() => dispatch({ type: "discard" })} />
        )}
      </div>
    </div>
  );
}

function Result({ state, onApply, onDiscard }: { state: State; onApply: () => void; onDiscard: () => void }) {
  const { result, applied } = state;
  if (!result) return null;
  const { extraction, issues, checks, proposal, engines, notices } = result;
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const productName = (sku: string | null) => state.catalog.find((p) => p.sku === sku)?.name.split(" (")[0] ?? "Producto sin identificar";

  return (
    <>
      {notices.map((n) => (
        <Alert key={n} tone="warning">
          {n}
        </Alert>
      ))}

      <Panel step="2" title="Datos estructurados" aside={engines.extractor.simulated ? <SimulatedBadge>Reglas locales · {engines.extractor.name}</SimulatedBadge> : <span className="text-xs font-medium">IA · {engines.extractor.name}</span>}>
        <dl className="grid gap-px overflow-hidden rounded-xl border border-[#e3e6eb] bg-[#e3e6eb] text-sm sm:grid-cols-2">
          <Field label="Pedido" value={extraction.order_ref} />
          <Field label="Cliente" value={extraction.customer} />
          {extraction.changes.map((c, i) =>
            c.kind === "quantity" ? (
              <Field key={i} label={`Cantidad · ${productName(c.sku)}`} value={c.quantity?.toString() ?? null} hint={c.stated_previous != null ? `el cliente indica que había ${c.stated_previous}` : undefined} />
            ) : (
              <Field key={i} label="Fecha de entrega" value={c.date ? formatDate(c.date) : null} hint={`«${c.raw}»`} />
            ),
          )}
        </dl>
        {extraction.notes.length > 0 && (
          <ul className="mt-3 grid gap-1 text-sm text-muted">
            {extraction.notes.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        )}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted hover:text-graphite">Ver JSON devuelto por el extractor</summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-[#0f172a] p-4 font-mono text-xs leading-relaxed text-[#e2e8f0]">{JSON.stringify(extraction, null, 2)}</pre>
        </details>
      </Panel>

      <Panel step="3" title="Validación" aside={<span className={`text-sm font-medium ${errors.length ? "text-err" : "text-ok"}`}>{errors.length ? `${errors.length} ${errors.length === 1 ? "error" : "errores"}` : "Sin errores"}</span>}>
        <ul className="grid gap-1.5 text-sm">
          {checks.map((c, i) => (
            <li key={`${c.rule}-${i}`} className="flex items-start gap-2">
              <span aria-hidden className={`mt-0.5 grid size-4 shrink-0 place-content-center rounded-full text-[10px] font-bold text-white ${c.passed ? "bg-ok" : "bg-err"}`}>
                {c.passed ? "✓" : "✕"}
              </span>
              <span>
                <span className="sr-only">{c.passed ? "Cumple: " : "No cumple: "}</span>
                {c.rule}
              </span>
            </li>
          ))}
        </ul>
        {errors.length > 0 && (
          <Alert tone="error" title="No se puede proponer ningún cambio">
            <ul className="grid gap-1">
              {errors.map((e) => (
                <li key={e.code + e.message}>{e.message}</li>
              ))}
            </ul>
          </Alert>
        )}
        {warnings.length > 0 && (
          <Alert tone="warning" title="Para revisar antes de confirmar">
            <ul className="grid gap-1">
              {warnings.map((w) => (
                <li key={w.code + w.message}>{w.message}</li>
              ))}
            </ul>
          </Alert>
        )}
      </Panel>

      {proposal && (
        <Panel step="4" title="Propuesta de actualización" aside={<span className="font-mono text-xs text-muted">{proposal.model} · {proposal.order_ref}</span>}>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <caption className="sr-only">Cambios propuestos en el pedido {proposal.order_ref}</caption>
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="pb-2 font-medium">Campo</th>
                  <th scope="col" className="pb-2 font-medium">Actual</th>
                  <th scope="col" className="pb-2 font-medium">Propuesto</th>
                </tr>
              </thead>
              <tbody>
                {proposal.changes.map((c) => (
                  <tr key={c.field} className="border-t border-[#e3e6eb]">
                    <th scope="row" className="py-2.5 pr-4 font-normal">
                      {c.label}
                      <span className="block font-mono text-[11px] text-muted">{c.field}</span>
                    </th>
                    <td className="py-2.5 pr-4 font-mono text-muted line-through">{formatValue(c.before)}</td>
                    <td className="py-2.5 font-mono font-semibold text-[#1d4ed8]">{formatValue(c.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {state.step !== "applied" && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={onApply} disabled={state.step === "applying"} className="btn bg-[#15803d] text-white hover:bg-[#166534] disabled:opacity-60">
                {state.step === "applying" ? (
                  <>
                    <Spinner light /> Aplicando…
                  </>
                ) : (
                  "Confirmar cambios"
                )}
              </button>
              <button type="button" onClick={onDiscard} className="btn btn-ghost">
                Descartar
              </button>
              <span className="text-xs text-muted">Se escribirá en el sandbox, no en un ERP real.</span>
            </div>
          )}
          {state.error && state.step === "processed" && (
            <Alert tone="error" title={state.error.code === "conflict" ? "El pedido ha cambiado" : "No se pudo aplicar"}>
              {state.error.message}
            </Alert>
          )}
        </Panel>
      )}

      {applied && (
        <Panel step="5" title="Resultado" aside={engines.gateway.simulated ? <SimulatedBadge>Sandbox</SimulatedBadge> : <span className="text-xs font-medium">{engines.gateway.name}</span>}>
          <Alert tone="success" title={`Pedido ${applied.order.ref} actualizado · versión ${applied.order.version}`}>
            Registro en el historial: «{applied.message}»
          </Alert>
          <p className="mt-4 text-sm text-muted">El pedido actualizado aparece resaltado en «Pedidos del sandbox». Puedes procesar otra solicitud sobre el nuevo estado.</p>
          <button type="button" onClick={onDiscard} className="btn btn-ghost mt-4">
            Procesar otra solicitud
          </button>
        </Panel>
      )}
    </>
  );
}

/* ---------- Piezas ---------- */

function Panel({ step, title, aside, children }: { step?: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="animate-rise rounded-2xl border border-[#e3e6eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2.5 font-semibold">
          {step && <span className="grid size-6 place-content-center rounded-full bg-[#eff4ff] font-mono text-xs text-[#1d4ed8]">{step}</span>}
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Field({ label, value, hint }: { label: string; value: string | null; hint?: string }) {
  return (
    <div className="bg-white p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-1 font-mono ${value ? "" : "text-err"}`}>
        {value ?? "No indicado"}
        {hint && <span className="mt-0.5 block font-sans text-xs text-muted">{hint}</span>}
      </dd>
    </div>
  );
}

function OrdersTable({ orders, catalog, changedRef }: { orders: Order[]; catalog: Product[]; changedRef?: string }) {
  const shortName = (sku: string) => catalog.find((p) => p.sku === sku)?.name.split(" (")[0] ?? sku;
  return (
    <ul className="grid gap-3 text-sm">
      {orders.map((o) => (
        <li key={o.ref} className={`rounded-xl border p-3 transition-colors ${o.ref === changedRef ? "border-[#15803d] bg-[#f0fdf4]" : "border-[#e3e6eb]"}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono font-semibold">{o.ref}</span>
            <span className={`text-xs ${o.state === "done" ? "text-muted" : "text-ok"}`}>{STATE_LABELS[o.state]}</span>
          </div>
          <p className="text-muted">
            {o.customer} · entrega {formatDate(o.commitment_date)}
          </p>
          <ul className="mt-1.5 grid gap-0.5 font-mono text-xs text-muted">
            {o.lines.map((l) => (
              <li key={l.line_id}>
                {l.quantity} × {shortName(l.sku)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Alert({ tone, title, children }: { tone: "error" | "warning" | "success"; title?: string; children: React.ReactNode }) {
  const styles = {
    error: "border-[#f5c2c0] bg-[#fef3f2] text-[#912018]",
    warning: "border-[#f5d9a8] bg-[#fffaeb] text-[#7a4504]",
    success: "border-[#bbe5c8] bg-[#f0fdf4] text-[#14532d]",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={`mt-4 rounded-xl border p-3.5 text-sm ${styles}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}

function SimulatedBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#f5d9a8] bg-[#fffaeb] px-2.5 py-0.5 text-xs text-[#7a4504]">Simulación · {children}</span>;
}

function Spinner({ light = false }: { light?: boolean }) {
  return <span aria-hidden className={`inline-block size-4 animate-spin rounded-full border-2 ${light ? "border-white/40 border-t-white" : "border-line border-t-blue"}`} />;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatValue(value: string | number) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : String(value);
}
