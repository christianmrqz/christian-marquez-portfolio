/** Copia texto al portapapeles. Devuelve false si el navegador no lo permite (contexto no seguro, permisos…). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
