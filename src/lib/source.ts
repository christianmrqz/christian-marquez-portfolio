import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Lee un fragmento de código real del repositorio, delimitado por marcadores:
 *   Python:     # region: nombre   …   # endregion
 *   TypeScript: // region: nombre  …   // endregion
 * Se ejecuta al generar la página: lo que se muestra es siempre el código que existe.
 */
export function readRegion(file: string, region: string) {
  const lines = readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), file), "utf8").split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `# region: ${region}` || l.trim() === `// region: ${region}`);
  if (start < 0) throw new Error(`No existe la región «${region}» en ${file}`);
  const end = lines.findIndex((l, i) => i > start && /^\s*(#|\/\/) endregion\s*$/.test(l));
  const body = lines.slice(start + 1, end < 0 ? undefined : end);
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length));
  return { file, startLine: start + 2, code: body.map((l) => l.slice(indent)).join("\n") };
}

/** Número de tests definidos en una carpeta (Python «def test_» o Vitest «it(»/«test(»). */
export function countTests(files: string[]) {
  return files.reduce((total, file) => {
    const text = readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), file), "utf8");
    return total + (text.match(/^\s*def test_|^\s*(it|test)\(/gm)?.length ?? 0);
  }, 0);
}
