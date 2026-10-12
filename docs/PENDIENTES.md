# Material y decisiones pendientes

Lo que falta para completar el portfolio. Nada de esto aparece en la interfaz pública.

## Resuelto (12/10/2026)

- Inglés C1 confirmado (`src/content/profile.ts`).
- Teléfono visible en la web y en los CV.
- Caso Movistar: sección de dispositivos del hogar y el reto del sistema central de datos.
- Caso Odoo: PDFs de clientes, módulos a medida, Make, todas las versiones hasta la más reciente.
- DexLab: la IA del asistente queda desactivada por decisión; la web lo explica así.
- RequestFlow AI incluido como proyecto personal en desarrollo, sin enlaces.

## Después del despliegue

- [ ] Comprobar en producción la demo ERP (`/api/erp?op=health`) y DexLab dentro del iframe.
- [ ] Google Search Console: añadir la propiedad, definir `GOOGLE_SITE_VERIFICATION` en Vercel y enviar `/sitemap.xml`.
- [ ] Poner el enlace del portfolio en LinkedIn y en los CV.
- [ ] Dominio propio (opcional). Si se usa, definir `NEXT_PUBLIC_SITE_URL` y volver a desplegar.

## Opcional

- RequestFlow AI: publicar el repositorio (y, si se quiere, la web en modo demo con `npm run dev:demo`) para añadir enlaces al caso.
- DexLab: `Content-Security-Policy: frame-ancestors 'self' https://<dominio-del-portfolio>` para que solo el portfolio pueda incrustarla.
- Capturas públicas del área privada de Movistar, si existen y se pueden usar.
