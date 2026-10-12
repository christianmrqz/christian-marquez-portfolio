import Link from "next/link";
import { profile } from "@/content/profile";

export function SiteFooter() {
  return (
    <footer className="no-print on-dark bg-graphite text-ivory">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-muted-dark md:flex-row md:items-center md:justify-between">
        <p>
          {profile.name} · {profile.workPreference}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a className="link-underline hover:text-ivory" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </li>
          <li>
            <a className="link-underline hover:text-ivory" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <Link className="link-underline hover:text-ivory" href="/vista-rapida">
              Vista rápida
            </Link>
          </li>
        </ul>
        <p className="text-xs">Hecho con Next.js, TypeScript y Python. Datos de las demos ficticios.</p>
      </div>
    </footer>
  );
}
