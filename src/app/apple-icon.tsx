import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icono para iOS generado en el build: el mismo monograma que icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#17181c", color: "#f4f1ea", fontSize: 84, fontWeight: 700, letterSpacing: -4, fontFamily: "sans-serif", position: "relative" }}>
        CM
        <div style={{ position: "absolute", top: 28, right: 28, width: 18, height: 18, borderRadius: 999, background: "#8199ff" }} />
      </div>
    ),
    size,
  );
}
