import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { CommandPalette } from "@/components/site/command-palette";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { profile } from "@/content/profile";
import { KEYWORDS } from "@/lib/seo";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-instrument", display: "swap" });

const description = `Portfolio de ${profile.name}, ${profile.role.toLowerCase()}: React, Vue y TypeScript; Python, Odoo e integraciones con la API de OpenAI. Experiencia en Telefónica (Movistar). ${profile.workPreference}, ${profile.availability.toLowerCase()}.`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: `${profile.name} · ${profile.role} (React, Python, Odoo)`, template: `%s · ${profile.shortName}` },
  description,
  applicationName: `${profile.name} · Portfolio`,
  authors: [{ name: profile.name, url: profile.linkedin }],
  creator: profile.name,
  keywords: KEYWORDS,
  category: "technology",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: profile.name,
    url: "/",
    title: `${profile.name} · ${profile.role}`,
    description,
  },
  twitter: { card: "summary_large_image", title: `${profile.name} · ${profile.role}`, description },
};

export const viewport: Viewport = { themeColor: "#f4f1ea" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body className="min-h-dvh antialiased">
        <SiteHeader />
        <main id="contenido">{children}</main>
        <SiteFooter />
        <CommandPalette />
      </body>
    </html>
  );
}
