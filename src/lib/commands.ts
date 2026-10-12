import type { CommandItem } from "@/content/site";

/** Normaliza para buscar sin tildes ni mayúsculas. */
export const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Filtra la paleta: todas las palabras de la consulta deben aparecer en la etiqueta, la pista o las palabras clave. */
export function filterCommands(items: CommandItem[], query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return items;
  return items.filter((item) => {
    const haystack = normalize(`${item.label} ${item.hint ?? ""} ${item.keywords ?? ""} ${item.group}`);
    return terms.every((t) => haystack.includes(t));
  });
}
