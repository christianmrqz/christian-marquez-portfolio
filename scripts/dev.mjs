// Arranca el portfolio (Next.js) y el servicio Python de la demo ERP en paralelo. Ctrl+C detiene ambos.
// Python: usa la variable PYTHON si existe; si no, «python» (Windows) o «python3».
import { spawn } from "node:child_process";

const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const port = process.env.ERP_PORT ?? "8001";

const children = [
  spawn(python, ["-m", "erp_service.server", port], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev"], {
    stdio: "inherit",
    env: { ...process.env, ERP_SERVICE_URL: process.env.ERP_SERVICE_URL ?? `http://127.0.0.1:${port}` },
  }),
];

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`Un proceso terminó con código ${code}. Deteniendo el resto.`);
    for (const other of children) if (other !== child && !other.killed) other.kill();
    process.exitCode = code ?? 0;
  });
}
process.on("SIGINT", () => children.forEach((c) => c.kill()));
