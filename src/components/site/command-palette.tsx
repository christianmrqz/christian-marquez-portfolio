"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { commandItems, type CommandItem } from "@/content/site";
import { profile } from "@/content/profile";
import { copyText } from "@/lib/clipboard";
import { filterCommands } from "@/lib/commands";

export const OPEN_PALETTE_EVENT = "palette:open";

/**
 * Paleta de comandos (Ctrl/Cmd + K). Usa <dialog> nativo para el foco atrapado y Escape,
 * y el patrón combobox + listbox con aria-activedescendant para que el foco no salga del campo.
 */
export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("");
  const listId = useId();

  const results = useMemo(() => filterCommands(commandItems, query), [query]);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    setActive(0);
    dialog.showModal();
    inputRef.current?.focus();
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, open);
    };
  }, [open, close]);

  async function run(item: CommandItem) {
    if ("action" in item) {
      const ok = await copyText(profile.email);
      setStatus(ok ? `Email copiado: ${profile.email}` : `No se pudo copiar. Email: ${profile.email}`);
      close();
      return;
    }
    close();
    if (item.external) window.open(item.href, "_blank", "noopener,noreferrer");
    else router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Home") {
      setActive(0);
    } else if (e.key === "End") {
      setActive(Math.max(results.length - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) void run(item);
    }
  }

  const groups = (["Navegar", "Proyectos", "Acciones"] as const)
    .map((g) => ({ group: g, items: results.filter((r) => r.group === g) }))
    .filter((g) => g.items.length);
  const optionId = (item: CommandItem) => `${listId}-${item.id}`;
  const activeItem = results[active];

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-label="Paleta de comandos"
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-0 mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-2xl border border-line bg-paper p-0 text-graphite shadow-2xl backdrop:bg-graphite/45 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg aria-hidden viewBox="0 0 20 20" className="size-4 shrink-0 text-muted">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeItem ? optionId(activeItem) : undefined}
            aria-autocomplete="list"
            aria-label="Buscar página o acción"
            placeholder="Ir a… proyectos, laboratorio, copiar email"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
          <button type="button" onClick={close} className="kbd shrink-0" aria-label="Cerrar">
            Esc
          </button>
        </div>
        <div id={listId} role="listbox" aria-label="Resultados" className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
          {groups.map(({ group, items }) => (
            <div key={group} role="group" aria-label={group} className="pb-1">
              <div aria-hidden className="eyebrow px-3 pb-1 pt-2 text-muted">
                {group}
              </div>
              {items.map((item) => {
                const index = results.indexOf(item);
                const selected = index === active;
                return (
                  <div
                    key={item.id}
                    id={optionId(item)}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActive(index)}
                    onClick={() => void run(item)}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm ${
                      selected ? "bg-graphite text-ivory" : ""
                    }`}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.hint && <span className={`truncate text-xs ${selected ? "text-muted-dark" : "text-muted"}`}>{item.hint}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {!results.length && <p className="px-3 py-8 text-center text-sm text-muted">Sin resultados para «{query}».</p>}
        </div>
        <div className="flex justify-between border-t border-line px-4 py-2 text-xs text-muted">
          <span>↑ ↓ para moverte · Intro para abrir</span>
          <span>{results.length} resultados</span>
        </div>
      </dialog>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      {status && <Toast message={status} onDone={() => setStatus("")} />}
    </>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <div aria-hidden className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-rise rounded-full bg-graphite px-4 py-2 text-sm text-ivory shadow-lg">
      {message}
    </div>
  );
}
