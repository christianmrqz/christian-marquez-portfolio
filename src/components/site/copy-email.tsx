"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";

/** Copia el email y lo confirma en el propio botón (y a lectores de pantalla mediante role="status"). */
export function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function onClick() {
    setState((await copyText(email)) ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2400);
  }

  return (
    <>
      <button type="button" onClick={onClick} className={className}>
        {state === "copied" ? "Email copiado" : state === "failed" ? "No se pudo copiar" : "Copiar email"}
      </button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Email copiado al portapapeles" : state === "failed" ? `No se pudo copiar. El email es ${email}` : ""}
      </span>
    </>
  );
}
