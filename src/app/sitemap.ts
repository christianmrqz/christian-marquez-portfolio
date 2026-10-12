import type { MetadataRoute } from "next";
import { profile } from "@/content/profile";
import { cases } from "@/content/projects";
import { labDemos } from "@/content/site";

/** Fecha de la última revisión del contenido. Actualízala al cambiar textos en src/content. */
const CONTENT_UPDATED = new Date("2026-10-12");

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: [string, number][] = [
    ["/", 1],
    ["/vista-rapida", 0.8],
    ...cases.map((c): [string, number] => [`/proyectos/${c.slug}`, c.slug === "dexlab" ? 0.9 : 0.7]),
    ["/laboratorio", 0.7],
    ...labDemos.map((d): [string, number] => [d.href, 0.6]),
  ];
  return entries.map(([path, priority]) => ({
    url: new URL(path, profile.siteUrl).toString(),
    lastModified: CONTENT_UPDATED,
    changeFrequency: "monthly",
    priority,
  }));
}
