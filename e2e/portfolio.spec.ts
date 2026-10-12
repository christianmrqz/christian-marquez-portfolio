import { expect, test } from "@playwright/test";

test.describe("portfolio", () => {
  test("la portada presenta perfil, acciones y contacto", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Christian");
    await expect(page.getByRole("link", { name: "Ver proyectos" })).toHaveAttribute("href", "/#proyectos");
    await expect(page.getByRole("link", { name: "Contactar" })).toHaveAttribute("href", "/#contacto");
    await expect(page.getByText("Telefónica · Movistar")).toBeVisible();
    await expect(page.getByRole("link", { name: "christianmrqz92@gmail.com" }).first()).toHaveAttribute("href", "mailto:christianmrqz92@gmail.com");
    await expect(page.getByText(/Inglés · C1/).first()).toBeVisible(); // confirmado por Christian
    await expect(page.getByRole("link", { name: "+34 646 900 436" }).first()).toHaveAttribute("href", "tel:+34646900436");
  });

  test("sin scroll horizontal en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const path of ["/", "/proyectos/dexlab", "/proyectos/movistar", "/proyectos/requestflow", "/laboratorio", "/laboratorio/erp-ia", "/laboratorio/dashboard", "/vista-rapida"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(700); // datos simulados del dashboard (500 ms)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("teclado: el primer Tab lleva a «Saltar al contenido»", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  });

  test("movimiento reducido: el contenido sigue visible", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Proyectos destacados" })).toBeVisible();
    const opacity = await page.locator(".reveal").first().evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe("1");
    await context.close();
  });

  test("paleta de comandos con Ctrl+K: navegar y copiar el email", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/", { waitUntil: "networkidle" }); // el atajo se registra al hidratar
    await page.keyboard.press("Control+k");
    const input = page.getByRole("combobox", { name: "Buscar página o acción" });
    await expect(input).toBeFocused();
    await input.fill("panel incidencias");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/laboratorio\/dashboard$/);

    await page.getByRole("button", { name: /Menú|Ir a/ }).click();
    await page.getByRole("combobox", { name: "Buscar página o acción" }).fill("copiar email");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Email copiado" })).toHaveCount(1);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("christianmrqz92@gmail.com");
  });

  test("páginas con título y metadatos propios, y 404", async ({ page }) => {
    await page.goto("/proyectos/dexlab");
    await expect(page).toHaveTitle(/DexLab/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/proyectos\/dexlab\/opengraph-image/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/proyectos\/dexlab$/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((t) => t.includes('"SoftwareApplication"'))).toBe(true);
    const response = await page.goto("/no-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Esta página no existe." })).toBeVisible();
  });
});

test("DexLab: se carga bajo demanda y se puede usar dentro del iframe @externo", async ({ page }) => {
  await page.goto("/proyectos/dexlab");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Abrir aplicación/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Probar aquí" }).click();
  const frame = page.frameLocator('iframe[title^="DexLab"]');
  const search = frame.getByPlaceholder(/Nombre o número/);
  await expect(search).toBeVisible({ timeout: 20_000 });
  // Si se escribe antes de que DexLab hidrate su buscador, el texto se pierde: se reintenta hasta ver la sugerencia
  // (y no basta con el texto «Drapion»: la portada de DexLab ya tiene un botón con ese nombre).
  await expect(async () => {
    // DexLab pide su índice de búsqueda al recibir el foco: se vuelve a enfocar en cada intento.
    await search.blur();
    await search.click();
    await search.fill("");
    await search.pressSequentially("drapio", { delay: 40 });
    await expect(frame.getByRole("option", { name: /Drapion #0452/ })).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 40_000 });
  await search.press("Enter");
  // La navegación ocurre dentro del iframe: se comprueba su URL y después la ficha en ese documento.
  await expect.poll(() => page.frames().find((f) => f.url().includes("pokedex-ia"))?.url(), { timeout: 20_000 }).toMatch(/\/pokemon\/drapion$/);
  const dexFrame = page.frames().find((f) => f.url().includes("/pokemon/drapion"))!;
  await expect(dexFrame.getByRole("heading", { level: 1, name: /Drapion/ })).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/proyectos\/dexlab$/); // la app no navega el portfolio
  await page.getByText("Móvil · 390").click();
  await expect.poll(() => page.locator("iframe").evaluate((el) => el.getBoundingClientRect().width)).toBe(390);
});
