import type { MetadataRoute } from "next";
import { profile } from "@/content/profile";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} · Portfolio`,
    short_name: profile.shortName,
    description: `${profile.role}. React, Vue, TypeScript, Python, Odoo e integraciones de IA.`,
    lang: "es",
    start_url: "/",
    display: "browser",
    background_color: "#f4f1ea",
    theme_color: "#f4f1ea",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
