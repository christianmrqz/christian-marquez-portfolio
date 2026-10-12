"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

type Viewport = { id: string; label: string; width: number | null };

const VIEWPORTS: Viewport[] = [
  { id: "auto", label: "Ajustar", width: null },
  { id: "tablet", label: "Tableta · 768", width: 768 },
  { id: "mobile", label: "Móvil · 390", width: 390 },
];

/** Si la app no ha avisado de su carga en este tiempo, se ofrece abrirla aparte (sin ocultar el iframe). */
const SLOW_AFTER_MS = 10_000;

type Status = "idle" | "loading" | "loaded" | "slow";

/**
 * Vista previa de un proyecto publicado dentro de un iframe.
 *
 * - No carga nada hasta que el visitante pulsa «Probar aquí».
 * - El evento load no garantiza que la app se haya incrustado (un bloqueo por X-Frame-Options también dispara load),
 *   así que el enlace «Abrir aplicación» está siempre visible y, si tarda, se sugiere abrirla aparte.
 * - «Ampliar» cambia el contenedor a pantalla completa sin mover el iframe en el DOM (moverlo lo recargaría).
 * - Los anchos de prueba cambian el ancho real del iframe: la app responde con sus propios breakpoints.
 */
export function ProjectPreview({
  url,
  title,
  poster,
  posterAlt,
  allow,
}: {
  url: string;
  title: string;
  poster: StaticImageData;
  posterAlt: string;
  /** Permisos de la Permissions Policy delegados al iframe. */
  allow?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [viewport, setViewport] = useState<Viewport>(VIEWPORTS[0]!);
  const [expanded, setExpanded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const frameWrap = useRef<HTMLDivElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const host = new URL(url).host;

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => setStatus("slow"), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [status, reloadKey]);

  // Pantalla ampliada: Escape la cierra y el scroll de la página queda bloqueado.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    const button = expandButton.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [expanded]);

  const started = status !== "idle";

  return (
    <div
      className={
        expanded
          ? "fixed inset-0 z-50 flex flex-col bg-graphite p-2 sm:p-4"
          : "on-dark flex flex-col overflow-hidden rounded-[1.25rem] bg-graphite p-2 shadow-[0_30px_80px_-40px_rgba(23,24,28,0.7)] sm:p-3"
      }
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded || undefined}
      aria-label={expanded ? `${title} ampliado` : undefined}
    >
      {/* Barra del navegador */}
      <div className="on-dark flex flex-wrap items-center gap-2 px-1 pb-2 text-ivory sm:gap-3 sm:px-2 sm:pb-3">
        <span aria-hidden className="hidden gap-1.5 sm:flex">
          <span className="size-2.5 rounded-full bg-graphite-3" />
          <span className="size-2.5 rounded-full bg-graphite-3" />
          <span className="size-2.5 rounded-full bg-graphite-3" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-graphite-2 px-3 py-1.5 font-mono text-xs text-muted-dark">
          <span aria-hidden>🔒 </span>
          {host}
        </span>
        {started && (
          <fieldset className="hidden items-center gap-1 rounded-full bg-graphite-2 p-1 md:flex">
            <legend className="sr-only">Ancho de prueba del iframe</legend>
            {VIEWPORTS.map((v) => (
              <label
                key={v.id}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-xs transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-soft ${
                  viewport.id === v.id ? "bg-ivory text-graphite" : "text-muted-dark hover:text-ivory"
                }`}
              >
                <input type="radio" name="preview-viewport" className="sr-only" checked={viewport.id === v.id} onChange={() => setViewport(v)} />
                {v.label}
              </label>
            ))}
          </fieldset>
        )}
        {started && (
          <button ref={expandButton} type="button" onClick={() => setExpanded((e) => !e)} className="rounded-full px-3 py-1.5 text-xs text-ivory ring-1 ring-graphite-3 hover:ring-ivory">
            {expanded ? "Cerrar ampliación" : "Ampliar"}
          </button>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ivory px-3 py-1.5 text-xs font-medium text-graphite hover:bg-blue-soft">
          Abrir aplicación <span aria-hidden>↗</span>
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>
      </div>

      {/* Lienzo */}
      <div
        ref={frameWrap}
        className={`relative flex justify-center overflow-hidden rounded-[0.75rem] bg-[#0c0d10] ${expanded ? "min-h-0 flex-1" : "h-[min(78svh,760px)] min-h-[520px]"}`}
      >
        {!started ? (
          <div className="absolute inset-0">
            <Image src={poster} alt={posterAlt} placeholder="blur" fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover object-top opacity-40 blur-[2px]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-graphite/55 p-6 text-center">
              <button type="button" onClick={() => setStatus("loading")} className="btn bg-ivory px-6 text-graphite hover:bg-blue-soft">
                Probar aquí
              </button>
              <p className="max-w-sm text-sm text-muted-dark">
                Carga la aplicación publicada dentro de esta página. También puedes abrirla en una pestaña nueva.
              </p>
            </div>
          </div>
        ) : (
          <>
            <iframe
              key={reloadKey}
              src={url}
              title={title}
              allow={allow}
              // Sin allow-top-navigation: la app no puede redirigir el portfolio. allow-popups para sus enlaces externos.
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setStatus("loaded")}
              style={{ width: viewport.width ? `${viewport.width}px` : "100%", maxWidth: "100%" }}
              className={`h-full border-0 bg-white transition-[width] duration-300 ${viewport.width ? "rounded-md ring-1 ring-graphite-3" : ""}`}
            />
            {status !== "loaded" && (
              <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-graphite/90 p-6 text-center text-ivory">
                {status === "loading" ? (
                  <>
                    <span aria-hidden className="size-8 animate-spin rounded-full border-2 border-graphite-3 border-t-blue-soft" />
                    <span className="text-sm">Cargando {title}…</span>
                  </>
                ) : (
                  <>
                    <span className="max-w-sm text-sm">
                      La aplicación está tardando más de lo normal. Puede que tu red o el navegador estén bloqueando el contenido incrustado.
                    </span>
                    <span className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setReloadKey((k) => k + 1);
                          setStatus("loading");
                        }}
                      >
                        Reintentar
                      </button>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        Abrir en otra pestaña
                      </a>
                      <button type="button" className="btn btn-ghost" onClick={() => setStatus("loaded")}>
                        Seguir esperando
                      </button>
                    </span>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {started && viewport.width && (
        <p className="px-2 pt-2 text-center text-xs text-muted-dark">
          Vista de prueba a {viewport.width} px: la aplicación recibe ese ancho real y aplica su diseño adaptado.
        </p>
      )}
    </div>
  );
}
