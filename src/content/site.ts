import { cases, DEXLAB_URL } from "./projects";
import { profile } from "./profile";

/** Demos del laboratorio: creadas para el portfolio, con datos ficticios. */
export const labDemos = [
  {
    slug: "erp-ia",
    href: "/laboratorio/erp-ia",
    title: "Solicitud → ERP",
    kicker: "Demo A · Integración ERP e IA",
    summary:
      "Un texto libre se convierte en datos estructurados, se valida contra un pedido ficticio y se propone como cambio antes de aplicarlo.",
    tags: ["Python", "Adaptadores", "Validación", "Odoo JSON-RPC"],
  },
  {
    slug: "dashboard",
    href: "/laboratorio/dashboard",
    title: "Panel de incidencias",
    kicker: "Demo B · Dashboard y componentes",
    summary:
      "Búsqueda, filtros, orden, tabla o tarjetas, edición de registros, temas del sistema de diseño y estados vacíos y de error.",
    tags: ["React", "useReducer", "Design tokens", "Accesibilidad"],
  },
] as const;

export const mainNav = [
  { label: "Proyectos", href: "/#proyectos" },
  { label: "Laboratorio", href: "/laboratorio" },
  { label: "Experiencia", href: "/#experiencia" },
  { label: "Contacto", href: "/#contacto" },
] as const;

export type CommandItem = {
  id: string;
  group: "Navegar" | "Proyectos" | "Acciones";
  label: string;
  hint?: string;
  keywords?: string;
} & ({ href: string; external?: boolean } | { action: "copy-email" });

export const commandItems: CommandItem[] = [
  { id: "home", group: "Navegar", label: "Inicio", href: "/" },
  { id: "quick", group: "Navegar", label: "Vista rápida", hint: "Resumen para recruiters", href: "/vista-rapida", keywords: "resumen cv perfil" },
  { id: "projects", group: "Navegar", label: "Proyectos destacados", href: "/#proyectos" },
  { id: "lab", group: "Navegar", label: "Laboratorio", href: "/laboratorio", keywords: "demos" },
  { id: "experience", group: "Navegar", label: "Experiencia", href: "/#experiencia", keywords: "trayectoria" },
  { id: "method", group: "Navegar", label: "Forma de trabajar", href: "/#forma-de-trabajar" },
  { id: "contact", group: "Navegar", label: "Contacto", href: "/#contacto" },
  ...cases.map<CommandItem>((c) => ({ id: `case-${c.slug}`, group: "Proyectos", label: c.title, hint: c.kicker, href: `/proyectos/${c.slug}` })),
  ...labDemos.map<CommandItem>((d) => ({ id: `lab-${d.slug}`, group: "Proyectos", label: d.title, hint: d.kicker, href: d.href })),
  { id: "copy-email", group: "Acciones", label: "Copiar email", hint: profile.email, action: "copy-email", keywords: "correo contacto" },
  { id: "linkedin", group: "Acciones", label: "Abrir LinkedIn", href: profile.linkedin, external: true },
  { id: "open-dexlab", group: "Acciones", label: "Abrir DexLab", hint: "pokedex-ia-nu.vercel.app", href: DEXLAB_URL, external: true },
  ...profile.cv.map<CommandItem>((cv) => ({ id: `cv-${cv.href}`, group: "Acciones", label: `Descargar ${cv.label}`, hint: "PDF", href: cv.href, external: true, keywords: "curriculum" })),
];
