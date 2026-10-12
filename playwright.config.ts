import { defineConfig } from "@playwright/test";

const PORT = 3200;
const ERP_PORT = 8011;
const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");

/**
 * Pruebas de extremo a extremo contra el build de producción y el servicio Python real.
 * Usan el Google Chrome instalado (channel: "chrome"). En CI: npx playwright install chromium y quitar channel.
 * La prueba marcada @externo depende de la DexLab publicada: npx playwright test --grep-invert @externo para omitirla.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: "chrome", trace: "retain-on-failure" },
  webServer: [
    { command: `${python} -m erp_service.server ${ERP_PORT}`, url: `http://127.0.0.1:${ERP_PORT}/api/erp?op=health`, reuseExistingServer: false },
    {
      command: `npx next build && npx next start -p ${PORT}`,
      url: `http://127.0.0.1:${PORT}`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: { ERP_SERVICE_URL: `http://127.0.0.1:${ERP_PORT}` },
    },
  ],
});
