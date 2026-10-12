import type { Metadata } from "next";
import { profile, specialties } from "@/content/profile";

/** Palabras clave del perfil: se reutilizan en metadatos y en knowsAbout del JSON-LD. */
export const SKILLS = [
  "React",
  "Vue.js",
  "TypeScript",
  "JavaScript",
  "Next.js",
  "Nuxt",
  "Redux-Saga",
  "Pinia",
  "Python",
  "Odoo",
  "API de OpenAI",
  "Make",
  "Django",
  "Node.js",
  "SQL",
  "APIs REST",
  "Integración de sistemas",
  "Integraciones de IA",
  "Playwright",
  "Docker",
];

export const KEYWORDS = [
  profile.name,
  "desarrollador frontend",
  "desarrollador full stack",
  "desarrollador React",
  "desarrollador Vue",
  "desarrollador Odoo",
  "integraciones OpenAI",
  "desarrollador remoto España",
  "portfolio desarrollador",
  ...SKILLS.slice(0, 11),
];

/**
 * Metadatos de una página: título, descripción, URL canónica, Open Graph y Twitter.
 * openGraph sustituye por completo al del layout, así que se repite la imagen por defecto.
 * Las páginas con su propio opengraph-image.tsx (casos) deben pasar ownImage: true.
 */
export function pageMetadata({ title, description, path, ownImage = false }: { title: string; description: string; path: string; ownImage?: boolean }): Metadata {
  const fullTitle = `${title} · ${profile.shortName}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: profile.name,
      url: path,
      title: fullTitle,
      description,
      // Con ownImage, la página tiene su propio opengraph-image.tsx (una imagen explícita aquí lo taparía).
      ...(ownImage ? {} : { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${profile.name} · ${profile.role}` }] }),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}

const absolute = (path: string) => new URL(path, profile.siteUrl).toString();
export const PERSON_ID = `${absolute("/")}#persona`;

export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    givenName: "Christian",
    familyName: "Márquez Alonso",
    jobTitle: profile.role,
    description: `${profile.role}. ${profile.headline} ${profile.workPreference}, ${profile.availability.toLowerCase()}.`,
    url: absolute("/"),
    image: absolute("/opengraph-image"),
    email: `mailto:${profile.email}`,
    telephone: profile.phone.display.replace(/\s/g, ""),
    address: { "@type": "PostalAddress", addressLocality: "Guadalajara", addressCountry: "ES" },
    sameAs: [profile.linkedin, profile.github],
    knowsAbout: [...SKILLS, ...specialties.map((s) => s.title)],
    knowsLanguage: profile.languages.map((l) => ({ "@type": "Language", name: l.name, alternateName: l.name === "Español" ? "es" : "en" })),
    alumniOf: { "@type": "EducationalOrganization", name: "CES Lope de Vega", address: { "@type": "PostalAddress", addressLocality: "Córdoba", addressCountry: "ES" } },
    hasOccupation: {
      "@type": "Occupation",
      name: profile.role,
      occupationLocation: { "@type": "Country", name: "España" },
      skills: SKILLS.join(", "),
    },
  };
}

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${absolute("/")}#web`, url: absolute("/"), name: `${profile.name} · Portfolio`, inLanguage: "es-ES", publisher: { "@id": PERSON_ID } },
      { "@type": "ProfilePage", "@id": `${absolute("/")}#perfil`, url: absolute("/"), name: `${profile.name} · ${profile.role}`, inLanguage: "es-ES", mainEntity: { "@id": PERSON_ID }, isPartOf: { "@id": `${absolute("/")}#web` } },
      personJsonLd(),
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absolute(item.path) })),
  };
}

/** Script JSON-LD con «<» escapado (recomendación de la guía de Next.js contra inyección). */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
