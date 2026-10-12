import { describe, expect, it } from "vitest";
import { commandItems } from "@/content/site";
import { filterCommands } from "./commands";

describe("paleta de comandos", () => {
  it("encuentra sin tildes y por palabras clave", () => {
    expect(filterCommands(commandItems, "vista rapida").map((c) => c.id)).toContain("quick");
    expect(filterCommands(commandItems, "correo").map((c) => c.id)).toEqual(["copy-email"]);
  });

  it("sin consulta devuelve todo y los ids son únicos", () => {
    expect(filterCommands(commandItems, " ")).toHaveLength(commandItems.length);
    expect(new Set(commandItems.map((c) => c.id)).size).toBe(commandItems.length);
  });
});
