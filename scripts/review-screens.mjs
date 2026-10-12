// Capturas de revisión visual en varios anchos y comprobación de errores de consola y de scroll horizontal.
// Uso: node scripts/review-screens.mjs <baseUrl> <carpetaSalida> [ruta ...]
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const [base = "http://localhost:3000", out = "test-results/screens", ...routes] = process.argv.slice(2);
const paths = routes.length ? routes : ["/"];
const widths = (process.env.WIDTHS ?? "390,768,1440").split(",").map(Number);
const full = process.env.FULL !== "0";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
let problems = 0;
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of paths) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const file = `${out}/${route === "/" ? "home" : route.replace(/[/?=&]+/g, "_")}-${width}.png`;
    await page.screenshot({ path: file, fullPage: full });
    const flag = overflow > 0 || errors.length ? "✗" : "✓";
    if (flag === "✗") problems++;
    console.log(`${flag} ${width}px ${route} overflow=${overflow}px errors=${errors.length}${errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""}`);
    errors.length = 0;
  }
  await page.close();
}
await browser.close();
process.exitCode = problems ? 1 : 0;
