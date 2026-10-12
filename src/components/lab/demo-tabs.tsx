"use client";

import { useId, useRef, useState } from "react";

const TABS = [
  { id: "try", label: "Probar" },
  { id: "build", label: "Cómo está construido" },
] as const;

/**
 * Pestañas accesibles (patrón WAI-ARIA tabs con flechas, Inicio y Fin).
 * Los dos paneles permanecen montados: cambiar de pestaña no pierde el estado de la demo.
 */
export function DemoTabs({ tryPanel, buildPanel }: { tryPanel: React.ReactNode; buildPanel: React.ReactNode }) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("try");
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    const next = e.key === "ArrowRight" ? (index === last ? 0 : index + 1) : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    setActive(TABS[next]!.id);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Modo de la demo" className="inline-flex rounded-full border border-line bg-paper p-1">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${active === tab.id ? "bg-graphite text-ivory" : "text-muted hover:text-graphite"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={active !== tab.id}
          tabIndex={0}
          className="mt-8 outline-none focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <h2 className="sr-only">{tab.label}</h2>
          {tab.id === "try" ? tryPanel : buildPanel}
        </div>
      ))}
    </div>
  );
}
