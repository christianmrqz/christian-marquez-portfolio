import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { DEXLAB_URL } from "@/content/projects";
import { labDemos } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Laboratorio",
  description: "Demos para probar: integración de una solicitud con un ERP (Python, adaptadores para OpenAI y Odoo) y un panel de incidencias en React. Cada una explica cómo está construida.",
  path: "/laboratorio",
});

export default function LabPage() {
  return (
    <div className="container-page pb-24 pt-12 md:pt-20">
      <p className="eyebrow text-blue">Laboratorio</p>
      <h1 className="mt-4 max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-balance">
        Prueba lo que construyo <span className="font-serif font-normal italic text-blue">y mira cómo está hecho.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        Demos pequeñas creadas para este portfolio, con datos ficticios. Cada una tiene una pestaña «Probar» y otra «Cómo está construido» con el recorrido de los
        datos, las decisiones y el código real.
      </p>

      <ul className="mt-14 grid gap-6 md:grid-cols-2">
        {labDemos.map((d) => (
          <li key={d.slug}>
            <Link href={d.href} className="group flex h-full flex-col justify-between gap-10 rounded-[1.75rem] border border-line bg-paper p-6 transition-colors hover:border-graphite md:p-8">
              <div>
                <p className="eyebrow text-blue">{d.kicker}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{d.title}</h2>
                <p className="mt-4 text-muted">{d.summary}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="flex flex-wrap gap-2">
                  {d.tags.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </span>
                <span className="text-sm font-medium transition-transform group-hover:translate-x-1">Probar →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <aside className="mt-6 flex flex-col justify-between gap-4 rounded-[1.75rem] bg-graphite p-6 text-ivory md:flex-row md:items-center md:p-8">
        <div>
          <p className="eyebrow text-blue-soft">Proyecto publicado</p>
          <p className="mt-2 text-xl font-semibold">DexLab también se puede probar dentro del portfolio.</p>
        </div>
        <div className="on-dark flex flex-wrap gap-3">
          <Link href="/proyectos/dexlab" className="btn btn-primary">
            Ver caso y probar
          </Link>
          <a href={DEXLAB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Abrir aplicación <span aria-hidden>↗</span>
          </a>
        </div>
      </aside>
    </div>
  );
}
