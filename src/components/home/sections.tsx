import Image from "next/image";
import Link from "next/link";
import { CopyEmail } from "@/components/site/copy-email";
import { experience } from "@/content/experience";
import { languageLabel, profile, specialties } from "@/content/profile";
import { cases, DEXLAB_REPO, DEXLAB_URL } from "@/content/projects";
import { labDemos } from "@/content/site";
import dexlabCover from "../../../public/projects/dexlab/home-desktop.png";
import { IntegrationDiagram } from "./integration-diagram";

export function SectionHeading({ id, index, title, intro }: { id: string; index: string; title: string; intro?: string }) {
  return (
    <div className="grid gap-4 pb-10 md:grid-cols-12 md:pb-14">
      <p className="eyebrow text-muted md:col-span-3">
        <span className="text-blue">{index}</span> · {id.replace(/-/g, " ")}
      </p>
      <div className="md:col-span-9">
        <h2 id={`${id}-titulo`} className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
          {title}
        </h2>
        {intro && <p className="mt-4 max-w-2xl text-pretty text-lg text-muted">{intro}</p>}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-titulo" className="container-page grid gap-12 pb-20 pt-12 md:pt-20 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pb-28">
      <div className="lg:col-span-7">
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-muted motion-safe:animate-rise">
          <span className="inline-flex items-center gap-2 text-ok">
            <span className="size-2 rounded-full bg-ok" aria-hidden />
            {profile.availability}
          </span>
          <span aria-hidden>/</span>
          <span>{profile.workPreference}</span>
        </p>
        <h1 id="hero-titulo" className="mt-6 text-[clamp(3rem,9vw,6.75rem)] font-semibold leading-[0.92] tracking-[-0.05em] motion-safe:animate-rise">
          Christian
          <br />
          Márquez <span className="font-serif font-normal italic tracking-[-0.02em] text-blue">Alonso</span>
        </h1>
        <p className="mt-8 max-w-xl text-pretty text-xl leading-snug tracking-[-0.01em] md:text-2xl">
          {profile.role}. {profile.headline}
        </p>
        <p className="mt-4 max-w-xl text-pretty text-muted">
          React, Vue y TypeScript en la interfaz; Python, Odoo y la API de OpenAI detrás.
        </p>
        <ul className="mt-8 grid max-w-xl gap-3 border-l border-line pl-5 text-sm">
          <li>
            <span className="font-medium">Telefónica · Movistar</span>
            <span className="text-muted"> — migración del área privada con React y Redux-Saga.</span>
          </li>
          <li>
            <span className="font-medium">ERP e IA</span>
            <span className="text-muted"> — módulos de Odoo que envían datos a la API de OpenAI y actualizan registros.</span>
          </li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/#proyectos" className="btn btn-primary">
            Ver proyectos
          </Link>
          <Link href="/#contacto" className="btn btn-ghost">
            Contactar
          </Link>
        </div>
      </div>
      <div className="lg:col-span-5">
        <IntegrationDiagram />
      </div>
    </section>
  );
}

/** Resumen de 15 segundos. Usa exactamente los mismos datos que el resto de la web. */
export function QuickFacts({ compact = false }: { compact?: boolean }) {
  const [current, previous] = experience;
  return (
    <dl className={`grid gap-px overflow-hidden rounded-2xl border border-line bg-line ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {[
        {
          term: "Ahora",
          detail: (
            <>
              {current?.role}
              <span className="block text-muted">{current?.period}</span>
            </>
          ),
        },
        {
          term: "Antes",
          detail: (
            <>
              {previous?.role} en {previous?.company}
              <span className="block text-muted">Área privada de Movistar · {previous?.period}</span>
            </>
          ),
        },
        {
          term: "Especialidades",
          detail: (
            <>
              {specialties.map((s) => s.title).join(" · ")}
              <span className="block text-muted">{profile.languages.map(languageLabel).join(" · ")}</span>
            </>
          ),
        },
        {
          term: "Contacto",
          detail: (
            <>
              <a className="link-underline inline-block min-h-6 break-all py-0.5" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              <a className="link-underline block min-h-6 w-fit py-0.5" href={profile.phone.href}>
                {profile.phone.display}
              </a>
              <span className="block text-muted">
                {profile.workPreference} · {profile.availability.toLowerCase()}
              </span>
            </>
          ),
        },
      ].map((item) => (
        <div key={item.term} className="bg-paper p-5">
          <dt className="eyebrow text-muted">{item.term}</dt>
          <dd className="mt-2 text-sm leading-relaxed">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

export function QuickView() {
  return (
    <section aria-label="Vista rápida" className="container-page pb-24">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="eyebrow text-muted">Vista rápida</h2>
        <Link href="/vista-rapida" className="link-underline text-sm">
          Resumen completo para imprimir
        </Link>
      </div>
      <QuickFacts />
    </section>
  );
}

export function Projects() {
  const [dexlab, ...others] = cases;
  if (!dexlab) return null;
  return (
    <section id="proyectos" aria-labelledby="proyectos-titulo" className="container-page py-24 md:py-32">
      <SectionHeading
        id="proyectos"
        index="01"
        title="Proyectos destacados"
        intro="Un proyecto publicado que puedes probar aquí mismo, dos casos de mi experiencia profesional contados sin código ni datos de las empresas, y un proyecto en desarrollo."
      />

      <article className="reveal group grid overflow-hidden rounded-[1.75rem] border border-line bg-paper lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-8 p-6 md:p-10 lg:col-span-5">
          <div>
            <p className="eyebrow text-blue">{dexlab.kind}</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              {dexlab.title} <span className="font-serif text-3xl font-normal italic text-muted md:text-4xl">{dexlab.kicker}</span>
            </h3>
            <p className="mt-5 text-pretty text-muted">{dexlab.summary}</p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tecnologías">
              {dexlab.tags.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/proyectos/dexlab" className="btn btn-primary">
              Ver caso y probar
            </Link>
            <a href={DEXLAB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Abrir aplicación <span aria-hidden>↗</span>
            </a>
            <a href={DEXLAB_REPO} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Código <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
        <Link href="/proyectos/dexlab" className="relative block min-h-64 overflow-hidden bg-graphite lg:col-span-7" tabIndex={-1} aria-hidden>
          <Image
            src={dexlabCover}
            alt=""
            placeholder="blur"
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        </Link>
      </article>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {others.map((c) => (
          <article key={c.slug} className="reveal flex flex-col justify-between gap-8 rounded-[1.75rem] border border-line p-6 md:p-8">
            <div>
              <p className="eyebrow text-muted">
                {c.kind} · {c.period}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{c.title}</h3>
              <p className="mt-1 font-serif text-xl italic text-muted">{c.kicker}</p>
              <p className="mt-4 text-pretty text-muted">{c.summary}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ul className="flex flex-wrap gap-2" aria-label="Tecnologías">
                {c.tags.slice(0, 4).map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
              <Link href={`/proyectos/${c.slug}`} className="link-underline text-sm font-medium">
                Leer el caso <span className="sr-only">{c.title}</span> →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LabTeaser() {
  return (
    <section aria-labelledby="laboratorio-titulo" className="on-dark bg-graphite py-24 text-ivory md:py-32">
      <div className="container-page">
        <div className="grid gap-4 pb-12 md:grid-cols-12">
          <p className="eyebrow text-muted-dark md:col-span-3">
            <span className="text-blue-soft">02</span> · laboratorio
          </p>
          <div className="md:col-span-9">
            <h2 id="laboratorio-titulo" className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
              Prueba lo que construyo <span className="font-serif font-normal italic text-blue-soft">y mira cómo está hecho.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted-dark">
              Dos demos creadas para este portfolio, con datos ficticios. Cada una tiene una pestaña para probarla y otra con el recorrido de los datos, las
              decisiones y el código.
            </p>
          </div>
        </div>
        <ul className="grid gap-6 md:grid-cols-2">
          {labDemos.map((d) => (
            <li key={d.slug}>
              <Link
                href={d.href}
                className="reveal group flex h-full flex-col justify-between gap-10 rounded-[1.75rem] border border-graphite-3 p-6 transition-colors hover:border-blue-soft md:p-8"
              >
                <div>
                  <p className="eyebrow text-blue-soft">{d.kicker}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{d.title}</h3>
                  <p className="mt-4 text-muted-dark">{d.summary}</p>
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
      </div>
    </section>
  );
}

export function Experience() {
  return (
    <section id="experiencia" aria-labelledby="experiencia-titulo" className="container-page py-24 md:py-32">
      <SectionHeading id="experiencia" index="03" title="Experiencia" />
      <ol className="border-t border-line">
        {experience.map((job) => (
          <li key={job.id} className="reveal grid gap-4 border-b border-line py-8 md:grid-cols-12 md:gap-6">
            <p className="font-mono text-sm text-muted md:col-span-3">{job.period}</p>
            <div className="md:col-span-6">
              <h3 className="text-xl font-semibold tracking-[-0.02em]">
                {job.role} <span className="font-normal text-muted">· {job.company}</span>
              </h3>
              <p className="mt-1 text-sm text-muted">{job.context}</p>
              <ul className="mt-4 grid gap-2 text-pretty">
                {job.points.map((p) => (
                  <li key={p} className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:size-1.5 before:rounded-full before:bg-line">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start gap-4 md:col-span-3 md:items-end">
              {job.stack.length > 0 && (
                <ul className="flex flex-wrap gap-2 md:justify-end" aria-label="Tecnologías">
                  {job.stack.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              {job.caseHref && (
                <Link href={job.caseHref} className="link-underline text-sm font-medium">
                  Ver caso <span className="sr-only">{job.company}</span> →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted">
        Formación: {profile.education.title} · {profile.education.center} · {profile.education.period}
      </p>
    </section>
  );
}

const principles = [
  {
    title: "Primero el proceso, después la pantalla",
    body: "Con clientes freelance empiezo por entender qué hacen hoy y qué registro debe cambiar. La experiencia comercial me ha enseñado a preguntar antes de proponer.",
  },
  {
    title: "La IA propone; el código valida",
    body: "En RequestFlow y en la demo ERP, el código valida lo que extrae el modelo antes de tocar un registro. En DexLab no activé la IA: los cálculos deterministas ya daban la respuesta completa. Uso un modelo cuando aporta, no por defecto.",
  },
  {
    title: "Encajar en lo que ya existe",
    body: "En Movistar trabajé sobre una tecnología y un diseño compartidos. Prefiero reutilizar componentes y respetar el sistema antes que crear variantes.",
  },
  {
    title: "Decir qué está probado",
    body: "Separo lo verificado de lo pendiente: en este portfolio, cada demo indica qué es simulación y qué conectaría con un servicio real.",
  },
];

export function Method() {
  return (
    <section id="forma-de-trabajar" aria-labelledby="forma-de-trabajar-titulo" className="border-y border-line bg-paper py-24 md:py-32">
      <div className="container-page">
        <SectionHeading id="forma-de-trabajar" index="04" title="Forma de trabajar" />
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {principles.map((p, i) => (
            <li key={p.title} className="bg-paper p-6 md:p-8">
              <span className="font-mono text-sm text-blue">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{p.title}</h3>
              <p className="mt-3 text-pretty text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contacto" aria-labelledby="contacto-titulo" className="container-page py-24 md:py-32">
      <p className="eyebrow text-muted">
        <span className="text-blue">05</span> · contacto
      </p>
      <h2 id="contacto-titulo" className="mt-6 max-w-4xl text-[clamp(2.25rem,6vw,4.75rem)] font-semibold leading-[1] tracking-[-0.045em] text-balance">
        Si buscas a alguien que conecte interfaz y negocio, <span className="font-serif font-normal italic text-blue">hablemos.</span>
      </h2>
      <p className="mt-6 max-w-xl text-lg text-muted">
        {profile.availability}. Busco trabajo en remoto desde España como desarrollador frontend o full stack.
      </p>
      <div className="mt-10 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-end md:justify-between">
        <div>
          <a href={`mailto:${profile.email}`} className="link-underline break-all text-2xl font-medium tracking-[-0.02em] md:text-4xl">
            {profile.email}
          </a>
          <p className="mt-3">
            <a href={profile.phone.href} className="link-underline text-lg text-muted hover:text-graphite">
              {profile.phone.display}
            </a>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <CopyEmail email={profile.email} className="btn btn-primary" />
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              LinkedIn <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
        <ul className="grid gap-2 text-sm">
          {profile.cv.map((cv) => (
            <li key={cv.href}>
              <a href={cv.href} download className="link-underline font-medium">
                Descargar {cv.label} (PDF)
              </a>
              <span className="text-muted"> · {cv.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
