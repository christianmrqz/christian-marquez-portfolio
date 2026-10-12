import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { QuickFacts } from "@/components/home/sections";
import { experience } from "@/content/experience";
import { languageLabel, profile, specialties } from "@/content/profile";
import { cases } from "@/content/projects";
import { labDemos } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Vista rápida",
  description: "Resumen de Christian Márquez Alonso en una página: experiencia, especialidades, proyectos, idiomas y contacto.",
  path: "/vista-rapida",
});

/** Resumen de una página para recruiters. Imprimible. Reutiliza exactamente los mismos datos que el resto de la web. */
export default function QuickViewPage() {
  return (
    <div className="container-page max-w-5xl pb-24 pt-12 print:pt-0 md:pt-16">
      <header className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-blue">Vista rápida</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">{profile.name}</h1>
          <p className="mt-2 text-lg">{profile.role}</p>
          <p className="mt-1 text-muted">
            {profile.location} · {profile.workPreference} · {profile.availability}
          </p>
          <p className="mt-1 text-muted">
            <a href={`mailto:${profile.email}`} className="link-underline">{profile.email}</a> ·{" "}
            <a href={profile.phone.href} className="link-underline">{profile.phone.display}</a>
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-3">
          <a href={`mailto:${profile.email}`} className="btn btn-primary">
            Escribir email
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            LinkedIn <span aria-hidden>↗</span>
          </a>
        </div>
      </header>

      <section aria-labelledby="qv-resumen" className="py-8">
        <h2 id="qv-resumen" className="sr-only">
          Resumen
        </h2>
        <p className="max-w-3xl text-pretty text-lg">{profile.summary}</p>
        <div className="mt-6">
          <QuickFacts />
        </div>
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="qv-experiencia">
          <h2 id="qv-experiencia" className="eyebrow text-muted">
            Experiencia
          </h2>
          <ol className="mt-4 grid gap-5">
            {experience.map((job) => (
              <li key={job.id}>
                <p className="font-medium">
                  {job.role} · {job.company}
                </p>
                <p className="font-mono text-xs text-muted">
                  {job.period} · {job.context}
                </p>
                <p className="mt-1 text-sm text-muted">{job.points[0]}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid content-start gap-10">
          <section aria-labelledby="qv-especialidades">
            <h2 id="qv-especialidades" className="eyebrow text-muted">
              Especialidades
            </h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {specialties.map((s) => (
                <div key={s.title}>
                  <dt className="font-medium">{s.title}</dt>
                  <dd className="text-muted">{s.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="qv-proyectos">
            <h2 id="qv-proyectos" className="eyebrow text-muted">
              Proyectos y demos
            </h2>
            <ul className="mt-4 grid gap-2 text-sm">
              {cases.map((c) => (
                <li key={c.slug}>
                  <Link href={`/proyectos/${c.slug}`} className="link-underline font-medium">
                    {c.title}
                  </Link>
                  <span className="text-muted"> · {c.kind.toLowerCase()}</span>
                </li>
              ))}
              {labDemos.map((d) => (
                <li key={d.slug}>
                  <Link href={d.href} className="link-underline font-medium">
                    {d.title}
                  </Link>
                  <span className="text-muted"> · demo del portfolio</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="qv-formacion">
            <h2 id="qv-formacion" className="eyebrow text-muted">
              Formación e idiomas
            </h2>
            <p className="mt-4 text-sm">{profile.education.title}</p>
            <p className="text-sm text-muted">
              {profile.education.center} · {profile.education.period}
            </p>
            <p className="mt-2 text-sm">{profile.languages.map(languageLabel).join(" · ")}</p>
          </section>
        </div>
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm">
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <a href={`mailto:${profile.email}`} className="link-underline">
            {profile.email}
          </a>
          <a href={profile.phone.href} className="link-underline">
            {profile.phone.display}
          </a>
        </p>
        <ul className="no-print flex flex-wrap gap-4">
          {profile.cv.map((cv) => (
            <li key={cv.href}>
              <a href={cv.href} download className="link-underline">
                {cv.label} (PDF)
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
