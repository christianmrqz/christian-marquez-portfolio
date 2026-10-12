import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectPreview } from "@/components/project-preview/project-preview";
import { breadcrumbJsonLd, JsonLd, PERSON_ID, pageMetadata } from "@/lib/seo";
import { cases, dexlabCapabilities, dexlabLayers, dexlabLimitations, DEXLAB_REPO, DEXLAB_URL, getCase, type CaseStudy } from "@/content/projects";
import dexlabPoster from "../../../../public/projects/dexlab/ficha-desktop.png";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const study = getCase((await params).slug);
  if (!study) return {};
  // La imagen Open Graph de cada caso la genera ./opengraph-image.tsx.
  return pageMetadata({ title: `${study.title} · ${study.kicker}`, description: study.summary, path: `/proyectos/${study.slug}`, ownImage: true });
}

export default async function CasePage({ params }: PageProps<"/proyectos/[slug]">) {
  const study = getCase((await params).slug);
  if (!study) notFound();
  const index = cases.indexOf(study);
  const next = cases[(index + 1) % cases.length]!;

  return (
    <article>
      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Proyectos", path: "/#proyectos" }, { name: study.title, path: `/proyectos/${study.slug}` }])} />
      {study.slug === "dexlab" && <JsonLd data={dexlabJsonLd(study)} />}
      <header className="container-page pb-8 pt-12 md:pb-12 md:pt-20">
        <nav aria-label="Ruta" className="text-sm text-muted">
          <Link href="/#proyectos" className="link-underline">
            Proyectos
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page">{study.title}</span>
        </nav>
        <p className="eyebrow mt-10 text-blue">
          {study.kind} · {study.period}
        </p>
        <h1 className="mt-4 text-[clamp(2.75rem,8vw,6rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
          {study.title} <span className="block font-serif text-[0.55em] font-normal italic tracking-[-0.02em] text-muted">{study.kicker}</span>
        </h1>
        <p className="mt-8 max-w-2xl text-pretty text-xl leading-snug">{study.summary}</p>
        {study.note && (
          <p className="mt-6 max-w-2xl border-l-2 border-blue pl-4 text-sm text-muted">
            <span className="font-medium text-graphite">Sobre esta información.</span> {study.note}
          </p>
        )}
        {study.links.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {study.links.map((l, i) =>
              l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}>
                  {l.label} <span aria-hidden>↗</span>
                </a>
              ) : (
                <Link key={l.href} href={l.href} className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}>
                  {l.label}
                </Link>
              ),
            )}
          </div>
        )}
      </header>

      {study.slug === "dexlab" && <DexlabTry />}

      <div className="container-page grid gap-16 pb-16 pt-10 md:pb-24 md:pt-16">
        <CaseBlock title="Problema">
          <p className="max-w-3xl text-pretty text-lg">{study.problem}</p>
        </CaseBlock>
        <CaseBlock title="Mi contribución">
          <List items={study.contribution} />
        </CaseBlock>
        <CaseBlock title="Tecnologías y motivo">
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {study.stack.map((s) => (
              <div key={s.name} className="bg-paper p-5">
                <dt className="font-mono text-sm font-medium">{s.name}</dt>
                <dd className="mt-2 text-sm text-muted">{s.why}</dd>
              </div>
            ))}
          </dl>
        </CaseBlock>
        {study.slug === "dexlab" && <DexlabLayers />}
        <Decision decision={study.decision} />
        <CaseBlock title="Dificultades">
          <List items={study.difficulties} />
        </CaseBlock>
        {study.slug === "dexlab" && (
          <CaseBlock title="Limitaciones conocidas">
            <List items={dexlabLimitations} />
          </CaseBlock>
        )}
        <CaseBlock title={study.outcome.label}>
          <List items={study.outcome.points} />
        </CaseBlock>
      </div>

      <nav aria-label="Siguiente caso" className="border-t border-line">
        <Link href={`/proyectos/${next.slug}`} className="container-page group flex items-center justify-between gap-6 py-12">
          <span>
            <span className="eyebrow text-muted">Siguiente caso</span>
            <span className="mt-2 block text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{next.title}</span>
          </span>
          <span aria-hidden className="text-3xl transition-transform group-hover:translate-x-2">
            →
          </span>
        </Link>
      </nav>
    </article>
  );
}

function CaseBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 md:grid-cols-12 md:gap-6">
      <h2 className="eyebrow pt-1 text-muted md:col-span-3">{title}</h2>
      <div className="md:col-span-9">{children}</div>
    </section>
  );
}

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid max-w-3xl gap-3 text-pretty">
      {items.map((p) => (
        <li key={p} className="relative pl-5 before:absolute before:left-0 before:top-[0.65em] before:h-px before:w-2.5 before:bg-blue">
          {p}
        </li>
      ))}
    </ul>
  );
}

function Decision({ decision }: { decision: CaseStudy["decision"] }) {
  return (
    <CaseBlock title={decision.label}>
      <div className="rounded-2xl border border-line bg-paper p-6 md:p-8">
        <h3 className="text-2xl font-semibold tracking-[-0.02em]">{decision.title}</h3>
        <p className="mt-3 max-w-3xl text-pretty text-muted">{decision.chosen}</p>
        <h4 className="eyebrow mt-8 text-muted">Alternativas descartadas</h4>
        <ul className="mt-3 grid gap-4 md:grid-cols-2">
          {decision.alternatives.map((a) => (
            <li key={a.option} className="border-t border-line pt-3">
              <p className="font-medium">{a.option}</p>
              <p className="mt-1 text-sm text-muted">{a.tradeoff}</p>
            </li>
          ))}
        </ul>
      </div>
    </CaseBlock>
  );
}

function DexlabTry() {
  return (
    <section aria-labelledby="probar-dexlab" className="container-page">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="probar-dexlab" className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            Pruébala sin salir de aquí
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Es la aplicación publicada, no una copia: busca un Pokémon, abre una calculadora o compara dos. Conserva su propio diseño.
          </p>
        </div>
      </div>
      <ProjectPreview url={DEXLAB_URL} title="DexLab, Pokédex inteligente (aplicación incrustada)" poster={dexlabPoster} posterAlt="Ficha de Drapion en DexLab" allow="clipboard-write" />

      <h2 className="mt-16 text-2xl font-semibold tracking-[-0.03em]">Qué puedes probar</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">Comprobado en la versión publicada el 12 de octubre de 2026.</p>
      <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {dexlabCapabilities.map((c) => (
          <li key={c.name} className="flex flex-col gap-2 bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <a href={new URL(c.route, DEXLAB_URL).toString()} target="_blank" rel="noopener noreferrer" className="link-underline font-medium">
                {c.name}
              </a>
              <span className={`chip ${c.status === "verificado" ? "!border-ok/30 !text-ok" : "!border-blue/30 !text-blue"}`}>
                {c.status === "verificado" ? "Funciona" : "Funciona · sin IA"}
              </span>
            </div>
            <p className="text-sm text-muted">{c.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DexlabLayers() {
  return (
    <CaseBlock title="Datos, cálculo e IA">
      <ol className="grid gap-4 lg:grid-cols-3">
        {dexlabLayers.map((layer, i) => (
          <li key={layer.name} className={`rounded-2xl p-6 ${i === 2 ? "border border-dashed border-line" : "on-dark bg-graphite text-ivory"}`}>
            <span className={`font-mono text-xs ${i === 2 ? "text-blue" : "text-blue-soft"}`}>0{i + 1}</span>
            <h3 className="mt-2 text-lg font-semibold">{layer.name}</h3>
            <p className={`mt-2 text-sm ${i === 2 ? "text-muted" : "text-muted-dark"}`}>{layer.what}</p>
            <p className={`mt-4 font-mono text-xs ${i === 2 ? "text-muted" : "text-muted-dark"}`}>{layer.where}</p>
          </li>
        ))}
      </ol>
    </CaseBlock>
  );
}

function dexlabJsonLd(study: CaseStudy) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${study.title}, ${study.kicker}`,
    description: study.summary,
    url: DEXLAB_URL,
    applicationCategory: "ReferenceApplication",
    operatingSystem: "Web",
    inLanguage: "es",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    author: { "@id": PERSON_ID },
    sameAs: [DEXLAB_REPO],
  };
}
