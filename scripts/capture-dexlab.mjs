// Regenera las capturas de DexLab que usa el portfolio (portada del caso y póster del iframe).
// Uso: node scripts/capture-dexlab.mjs   (requiere Google Chrome instalado)
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BASE = "https://pokedex-ia-nu.vercel.app";
const OUT = fileURLToPath(new URL("../public/projects/dexlab/", import.meta.url));
const shots = [
  { name: "home-desktop.png", path: "/", viewport: { width: 1440, height: 900 } },
  { name: "ficha-desktop.png", path: "/pokemon/drapion", viewport: { width: 1440, height: 900 } },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const s of shots) {
  const page = await browser.newPage({ viewport: s.viewport, deviceScaleFactor: s.scale ?? 1 });
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + s.name });
  console.log("✓", s.name);
  await page.close();
}
await browser.close();
