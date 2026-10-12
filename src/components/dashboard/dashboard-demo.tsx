"use client";

import { useEffect, useId, useReducer, useRef, useState } from "react";
import { ASSIGNEES, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS, fetchTickets, type Priority, type Status, type Ticket } from "@/lib/dashboard/data";
import { hasActiveFilters, initialState, reducer, selectSummary, selectVisible, validatePatch, type SortKey, type State, type TicketPatch } from "@/lib/dashboard/state";

/* ---------- Contenedor ---------- */

export function DashboardDemo() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [reloadKey, setReloadKey] = useState(0);

  // Carga simulada: se repite al cambiar de escenario o al reintentar.
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "load/start" });
    fetchTickets(state.scenario)
      .then((tickets) => !cancelled && dispatch({ type: "load/success", tickets }))
      .catch((e: Error) => !cancelled && dispatch({ type: "load/failure", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [state.scenario, reloadKey]);

  const visible = selectVisible(state);
  const summary = selectSummary(state.tickets);
  const editing = state.tickets.find((t) => t.id === state.editingId) ?? null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Controls state={state} dispatch={dispatch} />
      <div data-theme={state.theme} data-density={state.density} className="dash overflow-hidden rounded-[1.25rem] border border-[var(--d-border)] transition-colors">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-3 sm:p-5">
          <SummaryBar summary={summary} active={state.statusFilter} loading={state.load.status === "loading"} onSelect={(s) => dispatch({ type: "filter/status", value: s })} />
          <Toolbar state={state} dispatch={dispatch} count={visible.length} />
          <p role="status" aria-live="polite" className="sr-only">
            {state.load.status === "ready" ? `${visible.length} incidencias visibles de ${state.tickets.length}` : state.load.status === "loading" ? "Cargando incidencias" : "Error al cargar"}
          </p>
          {state.load.status === "loading" ? (
            <Skeleton />
          ) : state.load.status === "error" ? (
            <EmptyPanel
              tone="err"
              title="No se han podido cargar las incidencias"
              body={state.load.message}
              action={{ label: "Reintentar", onClick: () => setReloadKey((k) => k + 1) }}
              secondary={{ label: "Volver a datos normales", onClick: () => dispatch({ type: "scenario", value: "normal" }) }}
            />
          ) : state.tickets.length === 0 ? (
            <EmptyPanel
              title="Todavía no hay incidencias"
              body="Cuando un cliente abra una incidencia aparecerá aquí."
              action={{ label: "Cargar datos de ejemplo", onClick: () => dispatch({ type: "scenario", value: "normal" }) }}
            />
          ) : visible.length === 0 ? (
            <EmptyPanel title="Ninguna incidencia coincide" body="Prueba con otra búsqueda o quita algún filtro." action={{ label: "Limpiar filtros", onClick: () => dispatch({ type: "filters/clear" }) }} />
          ) : state.view === "tabla" ? (
            <TicketTable tickets={visible} sort={state.sort} lastSavedId={state.lastSavedId} onSort={(key) => dispatch({ type: "sort", key })} onEdit={(id) => dispatch({ type: "edit/start", id })} />
          ) : (
            <TicketCards tickets={visible} lastSavedId={state.lastSavedId} onEdit={(id) => dispatch({ type: "edit/start", id })} />
          )}
        </div>
        <EditDialog ticket={editing} theme={state.theme} onCancel={() => dispatch({ type: "edit/cancel" })} onSave={(id, patch) => dispatch({ type: "edit/save", id, patch })} />
      </div>
    </div>
  );
}

type Dispatch = React.Dispatch<Parameters<typeof reducer>[1]>;

/* ---------- Controles de la demo (fuera del panel) ---------- */

function Segmented<T extends string>({ legend, value, options, onChange }: { legend: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const name = useId();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="float-left mr-1 text-xs text-muted">{legend}</legend>
      <div className="inline-flex rounded-full border border-line bg-paper p-0.5">
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue ${
              value === o.value ? "bg-graphite text-ivory" : "text-muted hover:text-graphite"
            }`}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: Dispatch }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-dashed border-line px-4 py-3">
      <span className="eyebrow text-muted">Controles de la demo</span>
      <Segmented
        legend="Tema"
        value={state.theme}
        onChange={(v) => dispatch({ type: "theme", value: v })}
        options={[
          { value: "papel", label: "Papel" },
          { value: "grafito", label: "Grafito" },
          { value: "contraste", label: "Alto contraste" },
        ]}
      />
      <Segmented
        legend="Densidad"
        value={state.density}
        onChange={(v) => dispatch({ type: "density", value: v })}
        options={[
          { value: "comoda", label: "Cómoda" },
          { value: "compacta", label: "Compacta" },
        ]}
      />
      <Segmented
        legend="Datos"
        value={state.scenario}
        onChange={(v) => dispatch({ type: "scenario", value: v })}
        options={[
          { value: "normal", label: "Normales" },
          { value: "vacio", label: "Vacíos" },
          { value: "error", label: "Error de API" },
        ]}
      />
    </div>
  );
}

/* ---------- Panel ---------- */

const STATUS_TONE: Record<Status, string> = { abierta: "info", en_curso: "warn", en_espera: "muted", resuelta: "ok" };
const PRIORITY_TONE: Record<Priority, string> = { baja: "muted", media: "info", alta: "warn", critica: "err" };

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const style =
    tone === "muted"
      ? { color: "var(--d-muted)", background: "var(--d-surface-2)" }
      : { color: `var(--d-${tone})`, background: `var(--d-${tone}-bg)`, borderColor: `color-mix(in oklab, var(--d-${tone}) 30%, transparent)` };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 text-xs font-medium" style={style}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function SummaryBar({ summary, active, loading, onSelect }: { summary: ReturnType<typeof selectSummary>; active: State["statusFilter"]; loading: boolean; onSelect: (s: State["statusFilter"]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={active === s}
          onClick={() => onSelect(active === s ? "todas" : s)}
          className="rounded-xl border p-3 text-left transition-colors"
          style={{ borderColor: active === s ? "var(--d-accent)" : "var(--d-border)", background: "var(--d-surface)" }}
        >
          <span className="block text-xs" style={{ color: "var(--d-muted)" }}>
            {STATUS_LABELS[s]}
          </span>
          <span className="mt-1 block font-mono text-2xl font-semibold tabular-nums">{loading ? "–" : summary.byStatus[s]}</span>
        </button>
      ))}
      <div className="rounded-xl border p-3" style={{ borderColor: "var(--d-border)", background: "var(--d-surface-2)" }}>
        <span className="block text-xs" style={{ color: "var(--d-muted)" }}>
          Críticas sin resolver
        </span>
        <span className="mt-1 block font-mono text-2xl font-semibold tabular-nums" style={{ color: summary.openCritical ? "var(--d-err)" : undefined }}>
          {loading ? "–" : summary.openCritical}
        </span>
      </div>
      <div className="rounded-xl border p-3" style={{ borderColor: "var(--d-border)", background: "var(--d-surface-2)" }}>
        <span className="block text-xs" style={{ color: "var(--d-muted)" }}>
          Sin responsable
        </span>
        <span className="mt-1 block font-mono text-2xl font-semibold tabular-nums">{loading ? "–" : summary.unassigned}</span>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: "var(--d-surface)", borderColor: "var(--d-border)", color: "var(--d-text)" };

function Toolbar({ state, dispatch, count }: { state: State; dispatch: Dispatch; count: number }) {
  const searchId = useId();
  const disabled = state.load.status !== "ready" || state.tickets.length === 0;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 basis-56">
        <label htmlFor={searchId} className="mb-1 block text-xs" style={{ color: "var(--d-muted)" }}>
          Buscar
        </label>
        <input
          id={searchId}
          type="search"
          value={state.query}
          disabled={disabled}
          onChange={(e) => dispatch({ type: "query", value: e.target.value })}
          placeholder="Asunto, cliente, responsable o INC-…"
          className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[var(--d-accent)] disabled:opacity-50"
          style={inputStyle}
        />
      </div>
      <Select label="Estado" value={state.statusFilter} disabled={disabled} onChange={(v) => dispatch({ type: "filter/status", value: v as State["statusFilter"] })} options={[["todas", "Todos"], ...STATUSES.map((s) => [s, STATUS_LABELS[s]] as const)]} />
      <Select label="Prioridad" value={state.priorityFilter} disabled={disabled} onChange={(v) => dispatch({ type: "filter/priority", value: v as State["priorityFilter"] })} options={[["todas", "Todas"], ...PRIORITIES.map((p) => [p, PRIORITY_LABELS[p]] as const)]} />
      <div role="group" aria-label="Vista" className="inline-flex h-10 rounded-lg border p-0.5" style={{ borderColor: "var(--d-border)", background: "var(--d-surface)" }}>
        {(["tabla", "tarjetas"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={state.view === v}
            onClick={() => dispatch({ type: "view", value: v })}
            className="rounded-md px-3 text-sm capitalize"
            style={state.view === v ? { background: "var(--d-accent)", color: "var(--d-accent-text)" } : { color: "var(--d-muted)" }}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="w-full text-xs" style={{ color: "var(--d-muted)" }}>
        {state.load.status === "ready" && state.tickets.length > 0 && (
          <>
            {count} de {state.tickets.length} incidencias
            {hasActiveFilters(state) && (
              <>
                {" · "}
                <button type="button" className="underline underline-offset-2" onClick={() => dispatch({ type: "filters/clear" })}>
                  limpiar filtros
                </button>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}

function Select({ label, value, options, onChange, disabled }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (v: string) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs" style={{ color: "var(--d-muted)" }}>
        {label}
      </label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-lg border px-2 text-sm disabled:opacity-50" style={inputStyle}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "id", label: "ID", className: "hidden sm:table-cell" },
  { key: "subject", label: "Asunto" },
  { key: "customer", label: "Cliente", className: "hidden md:table-cell" },
  { key: "status", label: "Estado" },
  { key: "priority", label: "Prioridad" },
  { key: "updatedDaysAgo", label: "Actualizada", className: "hidden lg:table-cell" },
];

function ago(days: number) {
  return days === 0 ? "hoy" : days === 1 ? "ayer" : `hace ${days} días`;
}

// region: tabla
function TicketTable({ tickets, sort, lastSavedId, onSort, onEdit }: { tickets: Ticket[]; sort: State["sort"]; lastSavedId: string | null; onSort: (k: SortKey) => void; onEdit: (id: string) => void }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border" style={{ borderColor: "var(--d-border)", background: "var(--d-surface)" }}>
      <table className="w-full min-w-[22rem] text-left text-sm">
        <caption className="sr-only">Incidencias. Pulsa una cabecera para ordenar.</caption>
        <thead style={{ background: "var(--d-surface-2)" }}>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`px-3 py-2 font-medium ${c.className ?? ""}`}>
                <button type="button" onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 text-xs" style={{ color: sort.key === c.key ? "var(--d-text)" : "var(--d-muted)" }}>
                  {c.label}
                  <span aria-hidden className="font-mono">{sort.key === c.key ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
                </button>
              </th>
            ))}
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-t" style={{ borderColor: "var(--d-border)", background: t.id === lastSavedId ? "var(--d-ok-bg)" : undefined }}>
              <td className="hidden px-3 py-[var(--d-row-y)] font-mono text-xs tabular-nums sm:table-cell" style={{ color: "var(--d-muted)" }}>
                {t.id}
              </td>
              <td className="px-3 py-[var(--d-row-y)]">
                <span className="font-medium">{t.subject}</span>
                <span className="block text-xs md:hidden" style={{ color: "var(--d-muted)" }}>
                  <span className="font-mono sm:hidden">{t.id} · </span>
                  {t.customer}
                </span>
              </td>
              <td className="hidden px-3 py-[var(--d-row-y)] md:table-cell">{t.customer}</td>
              <td className="px-3 py-[var(--d-row-y)]">
                <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABELS[t.status]}</Badge>
              </td>
              <td className="px-3 py-[var(--d-row-y)]">
                <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge>
              </td>
              <td className="hidden px-3 py-[var(--d-row-y)] text-xs lg:table-cell" style={{ color: "var(--d-muted)" }}>
                {ago(t.updatedDaysAgo)} · {t.assignee}
              </td>
              <td className="px-3 py-[var(--d-row-y)] text-right">
                <button type="button" onClick={() => onEdit(t.id)} className="rounded-md px-2 py-1 text-xs font-medium underline-offset-2 hover:underline" style={{ color: "var(--d-accent)" }}>
                  Editar<span className="sr-only"> {t.id}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// endregion

function TicketCards({ tickets, lastSavedId, onEdit }: { tickets: Ticket[]; lastSavedId: string | null; onEdit: (id: string) => void }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tickets.map((t) => (
        <li key={t.id} className="flex flex-col justify-between gap-4 rounded-xl border p-4" style={{ borderColor: t.id === lastSavedId ? "var(--d-ok)" : "var(--d-border)", background: "var(--d-surface)" }}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs" style={{ color: "var(--d-muted)" }}>
                {t.id}
              </span>
              <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge>
            </div>
            <h4 className="mt-2 font-medium leading-snug">{t.subject}</h4>
            <p className="mt-1 text-xs" style={{ color: "var(--d-muted)" }}>
              {t.customer} · {t.assignee} · {ago(t.updatedDaysAgo)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABELS[t.status]}</Badge>
            <button type="button" onClick={() => onEdit(t.id)} className="text-xs font-medium hover:underline" style={{ color: "var(--d-accent)" }}>
              Editar<span className="sr-only"> {t.id}</span>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return (
    <div aria-hidden className="grid gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-lg" style={{ background: "var(--d-surface-2)" }} />
      ))}
    </div>
  );
}

function EmptyPanel({ title, body, action, secondary, tone }: { title: string; body: string; action: { label: string; onClick: () => void }; secondary?: { label: string; onClick: () => void }; tone?: "err" }) {
  return (
    <div role={tone === "err" ? "alert" : undefined} className="grid place-items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center" style={{ borderColor: "var(--d-border)", background: "var(--d-surface)" }}>
      <p className="font-semibold" style={{ color: tone === "err" ? "var(--d-err)" : undefined }}>
        {title}
      </p>
      <p className="max-w-sm text-sm" style={{ color: "var(--d-muted)" }}>
        {body}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={action.onClick} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "var(--d-accent)", color: "var(--d-accent-text)" }}>
          {action.label}
        </button>
        {secondary && (
          <button type="button" onClick={secondary.onClick} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--d-border)" }}>
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Edición ---------- */

function EditDialog({ ticket, theme, onCancel, onSave }: { ticket: Ticket | null; theme: State["theme"]; onCancel: () => void; onSave: (id: string, patch: TicketPatch) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<TicketPatch | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const ids = { subject: useId(), status: useId(), priority: useId(), assignee: useId() };
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (ticket && !dialog.open) {
      opener.current = document.activeElement;
      setDraft({ subject: ticket.subject, status: ticket.status, priority: ticket.priority, assignee: ticket.assignee });
      setSubmitted(false);
      dialog.showModal();
    } else if (!ticket && dialog.open) {
      dialog.close();
    }
  }, [ticket]);

  const errors = draft ? validatePatch(draft) : {};
  const shown = submitted ? errors : {};

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!ticket || !draft || Object.keys(errors).length) return;
    onSave(ticket.id, draft);
  }

  const field = "mt-1 h-10 w-full rounded-lg border px-3 text-sm";
  return (
    <dialog
      ref={ref}
      data-theme={theme}
      aria-labelledby={`${ids.subject}-title`}
      onClose={() => {
        onCancel();
        (opener.current as HTMLElement | null)?.focus?.();
      }}
      className="dash m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/40"
      style={{ borderColor: "var(--d-border)" }}
    >
      {ticket && draft && (
        <form onSubmit={submit} noValidate className="grid gap-4 p-5 sm:p-6">
          <div>
            <p className="font-mono text-xs" style={{ color: "var(--d-muted)" }}>
              {ticket.id} · {ticket.customer}
            </p>
            <h4 id={`${ids.subject}-title`} className="mt-1 text-lg font-semibold">
              Editar incidencia
            </h4>
          </div>
          <div>
            <label htmlFor={ids.subject} className="text-sm font-medium">
              Asunto
            </label>
            <input
              id={ids.subject}
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              aria-invalid={!!shown.subject}
              aria-describedby={shown.subject ? `${ids.subject}-err` : undefined}
              className={field}
              style={inputStyle}
            />
            {shown.subject && (
              <p id={`${ids.subject}-err`} className="mt-1 text-xs" style={{ color: "var(--d-err)" }}>
                {shown.subject}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor={ids.status} className="text-sm font-medium">
                Estado
              </label>
              <select id={ids.status} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })} className={field} style={inputStyle}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.priority} className="text-sm font-medium">
                Prioridad
              </label>
              <select id={ids.priority} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })} className={field} style={inputStyle}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.assignee} className="text-sm font-medium">
                Responsable
              </label>
              <select
                id={ids.assignee}
                value={draft.assignee}
                onChange={(e) => setDraft({ ...draft, assignee: e.target.value as TicketPatch["assignee"] })}
                aria-invalid={!!shown.assignee}
                aria-describedby={shown.assignee ? `${ids.assignee}-err` : undefined}
                className={field}
                style={inputStyle}
              >
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {shown.assignee && (
            <p id={`${ids.assignee}-err`} className="-mt-2 text-xs" style={{ color: "var(--d-err)" }}>
              {shown.assignee}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => ref.current?.close()} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--d-border)" }}>
              Cancelar
            </button>
            <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "var(--d-accent)", color: "var(--d-accent-text)" }}>
              Guardar cambios
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
