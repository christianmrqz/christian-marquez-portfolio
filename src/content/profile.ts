/**
 * Datos personales y de contacto. Fuente: CV frontend y CV full stack (docs/README → «Editar contenido»).
 * Todo lo que aparece en la web sobre Christian sale de este archivo o de experience.ts / projects.ts.
 */

export const profile = {
  name: "Christian Márquez Alonso",
  shortName: "Christian Márquez",
  role: "Desarrollador frontend / full stack",
  headline: "Construyo interfaces y las conecto con los sistemas que sostienen el negocio.",
  summary:
    "Trabajo con React, Vue y TypeScript en la interfaz, y con Python, Odoo y la API de OpenAI detrás. Participé en la migración del área privada de Movistar en Telefónica y, como freelance, desarrollo aplicaciones web y módulos de Odoo que integran IA en procesos de clientes.",
  location: "Guadalajara, España",
  workPreference: "Remoto desde España",
  availability: "Disponibilidad inmediata",
  email: "christianmrqz92@gmail.com",
  phone: { display: "+34 646 900 436", href: "tel:+34646900436" },
  linkedin: "https://www.linkedin.com/in/christian-m%C3%A1rquez-alonso/",
  github: "https://github.com/christianmrqz",
  repo: "https://github.com/christianmrqz/christian-marquez-portfolio",
  // En Vercel se usa el dominio de producción automáticamente; en local, localhost.
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  cv: [
    { label: "CV frontend", href: "/cv/christian-marquez-cv-frontend.pdf", note: "React, Vue y TypeScript" },
    { label: "CV full stack e IA", href: "/cv/christian-marquez-cv-fullstack-ia.pdf", note: "Python, Odoo e integraciones de IA" },
  ],
  languages: [
    { name: "Español", level: "Nativo", confirmed: true },
    // Confirmado por Christian el 12/10/2026. Si confirmed es false, la web oculta el nivel.
    { name: "Inglés", level: "C1", confirmed: true },
  ],
  education: {
    title: "Técnico Superior en Desarrollo de Aplicaciones Multiplataforma",
    center: "CES Lope de Vega, Córdoba",
    period: "2020 – 2022",
  },
} as const;

export type Language = (typeof profile.languages)[number];

/** Texto público de un idioma: el nivel solo se muestra cuando está confirmado. */
export function languageLabel(language: Language) {
  return language.confirmed ? `${language.name} · ${language.level}` : language.name;
}

export const specialties = [
  {
    title: "Interfaces web",
    detail: "React, Vue.js, TypeScript, Nuxt, Redux-Saga, Pinia, Sass. Componentes reutilizables y layouts responsive.",
  },
  {
    title: "Integración de sistemas",
    detail: "APIs REST, Python, Node.js, SQL. Odoo (de versiones anteriores a la más reciente): módulos a medida, Make y flujos de trabajo.",
  },
  {
    title: "IA aplicada",
    detail: "API de OpenAI dentro de procesos de negocio: PDFs de clientes, respuestas procesadas y registros del ERP actualizados.",
  },
  {
    title: "Calidad y equipo",
    detail: "Git, Docker, Vite, Jest, Playwright. Trabajo en Scrum y análisis de requisitos con clientes.",
  },
] as const;
