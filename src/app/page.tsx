import type { Metadata } from "next";
import { JsonLd, siteJsonLd } from "@/lib/seo";
import { Contact, Experience, Hero, LabTeaser, Method, Projects, QuickView } from "@/components/home/sections";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <Hero />
      <QuickView />
      <Projects />
      <LabTeaser />
      <Experience />
      <Method />
      <Contact />
    </>
  );
}
