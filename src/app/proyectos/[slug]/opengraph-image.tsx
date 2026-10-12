import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";
import { cases, getCase } from "@/content/projects";

export const alt = "Caso de proyecto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

/** Imagen Open Graph de cada caso, generada en el build con la identidad del portfolio. */
export default async function CaseImage({ params }: { params: Promise<{ slug: string }> }) {
  const study = getCase((await params).slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#17181c", color: "#f4f1ea", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 24, color: "#8199ff", letterSpacing: 2, textTransform: "uppercase" }}>{study?.kind ?? "Proyecto"}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>{study?.title ?? profile.name}</div>
          <div style={{ marginTop: 20, fontSize: 40, color: "#a3a5ad" }}>{study?.kicker}</div>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            {(study?.tags ?? []).slice(0, 5).map((t) => (
              <div key={t} style={{ display: "flex", border: "2px solid #33363e", borderRadius: 999, padding: "6px 18px", fontSize: 24, color: "#a3a5ad" }}>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a3a5ad" }}>
          <span>{profile.name}</span>
          <span>{profile.role}</span>
        </div>
      </div>
    ),
    size,
  );
}
