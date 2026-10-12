# Material y decisiones pendientes

Lo que falta para completar el portfolio. Nada de esto aparece en la interfaz pública.

## Resuelto (12/10/2026)

- Inglés C1 confirmado (`src/content/profile.ts`).
- Teléfono visible en la web y en los CV.
- Caso Movistar: sección de dispositivos del hogar y el reto del sistema central de datos.
- Caso Odoo: PDFs de clientes, módulos a medida, Make, todas las versiones hasta la más reciente.
- DexLab: la IA del asistente queda desactivada por decisión; la web lo explica así.
- RequestFlow AI incluido como proyecto personal en desarrollo, sin enlaces.

## Publicado

- Producción: https://christian-marquez-portfolio.vercel.app (verificado, ver VERIFICACION.md).

## Después del despliegue

- [ ] Google Search Console: añadir la propiedad, definir `GOOGLE_SITE_VERIFICATION` en Vercel y enviar `/sitemap.xml`.
- [ ] Poner el enlace del portfolio en LinkedIn y en los CV.
- [ ] Dominio propio (opcional). Si se usa, definir `NEXT_PUBLIC_SITE_URL` y volver a desplegar.

## Opcional

- RequestFlow AI: publicar el repositorio (y, si se quiere, la web en modo demo con `npm run dev:demo`) para añadir enlaces al caso.
- DexLab: lanzar la carga del índice de búsqueda también al escribir (hoy solo al enfocar; si el foco llega antes de hidratar, no carga).
- DexLab: `Content-Security-Policy: frame-ancestors 'self' https://<dominio-del-portfolio>` para que solo el portfolio pueda incrustarla.
- Capturas públicas del área privada de Movistar, si existen y se pueden usar.
