import Link from "next/link";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

export function LabHeader({ kicker, title, intro, badges, path }: { kicker: string; title: React.ReactNode; intro: string; badges: string[]; path: string }) {
  return (
    <header className="container-page pb-10 pt-12 md:pt-16">
      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Laboratorio", path: "/laboratorio" }, { name: kicker, path }])} />
      <nav aria-label="Ruta" className="text-sm text-muted">
        <Link href="/laboratorio" className="link-underline">
          Laboratorio
        </Link>
        <span aria-hidden> / </span>
        <span aria-current="page">{kicker}</span>
      </nav>
      <p className="eyebrow mt-8 text-blue">{kicker}</p>
      <h1 className="mt-3 max-w-4xl text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1] tracking-[-0.045em] text-balance">{title}</h1>
      <p className="mt-5 max-w-2xl text-pretty text-lg text-muted">{intro}</p>
      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Estado de la demo">
        {badges.map((b) => (
          <li key={b} className="rounded-full border border-warn/30 bg-[#fff8ec] px-3 py-1 text-xs text-warn">
            {b}
          </li>
        ))}
      </ul>
    </header>
  );
}
