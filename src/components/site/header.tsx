import Link from "next/link";
import { mainNav } from "@/content/site";
import { profile } from "@/content/profile";
import { PaletteButton } from "./palette-button";

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-full focus:bg-graphite focus:px-4 focus:py-2 focus:text-ivory"
      >
        Saltar al contenido
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${profile.name}, inicio`}>
          <Monogram />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
            {profile.shortName}
            <span className="hidden font-normal text-muted xl:inline"> · {profile.role}</span>
          </span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-graphite">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <PaletteButton className="ml-2 inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-line px-3 text-sm transition-colors hover:border-graphite">
            <span className="md:hidden">Menú</span>
            <span className="hidden md:inline">Ir a…</span>
            <span className="kbd hidden md:inline">Ctrl K</span>
          </PaletteButton>
        </nav>
      </div>
    </header>
  );
}

export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={`size-8 shrink-0 ${className}`}>
      <rect width="32" height="32" rx="8" className="fill-graphite" />
      <path d="M14.5 11.5a5 5 0 1 0 0 9" fill="none" stroke="#f4f1ea" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 21v-9.5l3 5 3-5V21" fill="none" stroke="#f4f1ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="6" r="2" className="fill-blue-soft" />
    </svg>
  );
}
