import { expect, test } from "@playwright/test";

test.describe("demo ERP", () => {
  test("solicitud válida: datos, validación, propuesta y aplicación", async ({ page }) => {
    await page.goto("/laboratorio/erp-ia");
    await expect(page.getByText("Simulación · Ficticios")).toBeVisible();
    await page.getByRole("button", { name: "Solicitud válida" }).click();
    await page.getByRole("button", { name: "Procesar solicitud" }).click();
    await expect(page.getByText("Sin errores")).toBeVisible();
    const proposal = page.getByRole("table", { name: /Cambios propuestos/ });
    await expect(proposal).toContainText("25");
    await expect(proposal).toContainText("40");
    await page.getByRole("button", { name: "Confirmar cambios" }).click();
    await expect(page.getByText("Pedido SO-1042 actualizado · versión 2")).toBeVisible();
    await expect(page.getByText(/40 × Tornillo M6/)).toBeVisible();
  });

  test("información insuficiente: explica qué falta y no propone cambios", async ({ page }) => {
    await page.goto("/laboratorio/erp-ia");
    await page.getByRole("button", { name: "Información insuficiente" }).click();
    await page.getByRole("button", { name: "Procesar solicitud" }).click();
    await expect(page.getByText("No se puede proponer ningún cambio")).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Falta el número de pedido (por ejemplo, SO-1042)." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar cambios" })).toHaveCount(0);
  });

  test("la pestaña técnica muestra código real del repositorio", async ({ page }) => {
    await page.goto("/laboratorio/erp-ia");
    await page.getByRole("tab", { name: "Cómo está construido" }).click();
    await expect(page.getByText("erp_service/ports.py:", { exact: false })).toBeVisible();
    await expect(page.getByText("class Extractor(Protocol):")).toBeVisible();
  });
});

test.describe("demo dashboard", () => {
  test("buscar, editar con validación y ver el cambio reflejado", async ({ page }) => {
    await page.goto("/laboratorio/dashboard");
    const table = page.getByRole("table", { name: /Incidencias/ });
    await expect(table).toBeVisible();
    await page.getByRole("searchbox", { name: "Buscar" }).fill("factura duplicada");
    await expect(page.getByText("1 de 18 incidencias")).toBeVisible();

    await page.getByRole("button", { name: "Editar INC-2041" }).click();
    const dialog = page.getByRole("dialog", { name: "Editar incidencia" });
    await dialog.getByLabel("Estado").selectOption("resuelta");
    await dialog.getByLabel("Responsable").selectOption("Sin asignar");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialog.getByText("Una incidencia resuelta necesita un responsable.")).toBeVisible();
    await dialog.getByLabel("Responsable").selectOption("Marta");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialog).toBeHidden();
    await expect(table.getByRole("row", { name: /INC-2041/ })).toContainText("Resuelta");
    await expect(page.getByRole("button", { name: "Editar INC-2041" })).toBeFocused();
  });

  test("orden accesible, vista de tarjetas y estados vacío y de error", async ({ page }) => {
    await page.goto("/laboratorio/dashboard");
    await page.getByRole("button", { name: /^Cliente/ }).click();
    await expect(page.getByRole("columnheader", { name: /Cliente/ })).toHaveAttribute("aria-sort", "ascending");
    await page.getByRole("button", { name: "tarjetas" }).click();
    await expect(page.getByRole("table", { name: /Incidencias/ })).toHaveCount(0);
    await page.getByRole("searchbox", { name: "Buscar" }).fill("zzz");
    await expect(page.getByText("Ninguna incidencia coincide")).toBeVisible();
    await page.getByText("Error de API").click();
    await expect(page.getByRole("alert").filter({ hasText: "No se han podido cargar" })).toBeVisible();
    await page.getByText("Vacíos").click();
    await expect(page.getByText("Todavía no hay incidencias")).toBeVisible();
  });
});
