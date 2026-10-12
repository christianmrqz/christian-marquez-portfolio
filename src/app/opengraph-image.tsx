import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name} · ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen Open Graph generada en el build con la misma identidad visual (marfil, grafito y azul). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f4f1ea", color: "#17181c", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#5a5c62" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#17704a" }} />
          {profile.availability} · {profile.workPreference}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>{profile.name}</div>
          <div style={{ marginTop: 28, fontSize: 38, color: "#1f4bff" }}>{profile.role}</div>
          <div style={{ marginTop: 12, fontSize: 30, color: "#5a5c62" }}>React · Vue · TypeScript · Python · Odoo · Integraciones de IA</div>
        </div>
        <div style={{ display: "flex", height: 10, width: "100%", background: "#17181c", borderRadius: 999 }}>
          <div style={{ width: "28%", background: "#1f4bff", borderRadius: 999 }} />
        </div>
      </div>
    ),
    size,
  );
}
