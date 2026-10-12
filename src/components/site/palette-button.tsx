"use client";

import { OPEN_PALETTE_EVENT } from "./command-palette";

/** Botón visible que abre la paleta (la misma que Ctrl/Cmd + K). */
export function PaletteButton({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      aria-keyshortcuts="Control+K Meta+K"
      className={className}
    >
      {children ?? (
        <>
          <span>Ir a…</span>
          <span className="kbd hidden sm:inline">Ctrl K</span>
        </>
      )}
    </button>
  );
}
