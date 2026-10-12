# Portfolio · Christian Márquez Alonso

Portfolio profesional de un desarrollador frontend / full stack, con un proyecto publicado incrustado (DexLab) y dos demos para probar: una integración solicitud → ERP con un servicio Python y un panel de incidencias.

- **Next.js 16** (App Router) · **React 19** · **TypeScript estricto** · **Tailwind CSS 4**
- **Python 3** (solo biblioteca estándar) para el servicio de la demo ERP
- Pruebas: **Vitest** (estado del dashboard y paleta), **unittest** (reglas y adaptadores del servicio Python), **Playwright** (recorridos de extremo a extremo con Chrome)

## Requisitos

- Node.js 20.9 o superior (probado con 21.7.1) y npm 10.
- Python 3.10 o superior (probado con 3.13.7). Sin paquetes adicionales.
- Google Chrome, solo para `npm run test:e2e` y los scripts de capturas.

`.npmrc` activa `legacy-peer-deps` para evitar un fallo interno de npm 10.5 al resolver dependencias opcionales (el mismo ajuste que DexLab).

## Puesta en marcha

```bash
npm install
npm run dev        # Next.js en http://localhost:3000 + servicio Python en http://127.0.0.1:8001
```

`npm run dev` arranca los dos procesos (`scripts/dev.mjs`). Para lanzarlos por separado: `npm run dev:web` y `npm run dev:erp`. Si Python no se llama `python`, usa `PYTHON=python3 npm run dev`.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Desarrollo: web y servicio Python |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run typecheck` | TypeScript estricto |
| `npm run lint` | ESLint (configuración de Next.js) |
| `npm test` | Vitest |
| `npm run test:py` | Tests del servicio Python |
| `npm run test:e2e` | Playwright: hace un build, levanta web y servicio y recorre la web en Chrome |
| `npm run check` | typecheck + lint + Vitest + tests de Python |
| `node scripts/capture-dexlab.mjs` | Regenera las capturas de DexLab de `public/projects/dexlab` |
| `node scripts/review-screens.mjs <url> <carpeta> [rutas…]` | Capturas a 390/768/1440 px con detección de scroll horizontal y errores de consola |

La prueba E2E marcada `@externo` usa la DexLab publicada. Sin red: `npx playwright test --grep-invert @externo`.

## Estructura

```
src/
  app/                       Rutas (App Router). Componentes de servidor salvo las demos
    page.tsx                 Inicio
    proyectos/[slug]/        Casos: dexlab, movistar, odoo-ia, requestflow (+ imagen Open Graph por caso)
    laboratorio/             Índice y demos (erp-ia, dashboard)
    vista-rapida/            Resumen imprimible para recruiters
    opengraph-image.tsx      Imagen Open Graph generada en el build
  content/                   ← TODO el texto editable (ver abajo)
  components/
    home/                    Secciones de la portada y esquema de integración (SVG)
    site/                    Cabecera, pie, paleta de comandos (Ctrl/Cmd + K)
    project-preview/         Vista previa reutilizable con iframe
    lab/                     Pestañas «Probar / Cómo está construido» y bloques técnicos
    erp/  dashboard/         Componentes cliente de las demos
  lib/
    dashboard/               Reducer y selectores puros + tests
    erp/                     Contrato JSON y cliente HTTP del servicio Python
    source.ts                Lee fragmentos de código real para mostrarlos en las demos
erp_service/                 Servicio Python de la demo ERP
  domain.py                  Tipos (nombres de campo de Odoo: sale.order, commitment_date…)
  extract_rules.py           Extractor determinista por reglas (la «simulación»)
  validate.py                Reglas de negocio y propuesta de cambios
  ports.py                   Interfaces Extractor y ErpGateway
  adapters/                  rules · openai · sandbox · odoo (JSON-RPC) · transporte HTTP
  pipeline.py  web.py        Orquestación y API HTTP
  server.py                  Servidor local
  tests/                     unittest
api/erp.py                   Función serverless de Vercel (mismo handler)
e2e/                         Pruebas de Playwright
docs/                        Verificación y material pendiente
```

## Editar contenido

Todo el texto sale de `src/content/`; las páginas no tienen textos sueltos sobre la experiencia.

- `profile.ts` — nombre, rol, titular, ubicación, disponibilidad, email, LinkedIn, CV, idiomas y especialidades.
  - **Idiomas**: un nivel solo se muestra con `confirmed: true` (inglés C1, confirmado).
- `experience.ts` — puestos. Solo información de los CV.
- `projects.ts` — casos (DexLab, Movistar, Odoo + OpenAI y RequestFlow AI): problema, contribución, tecnologías, decisión, dificultades y resultado; capacidades verificadas de DexLab, capas y limitaciones.
- `site.ts` — demos del laboratorio, navegación y elementos de la paleta de comandos.

La «Vista rápida», la portada, la paleta y el sitemap leen estos mismos datos. Los CV descargables están en `public/cv/`; para cambiarlos, sustituye los PDF y, si cambia el nombre, actualiza `profile.cv`.

Los fragmentos de código de «Cómo está construido» se leen del propio repositorio entre marcadores `# region: nombre` / `# endregion` (o `//` en TypeScript). Si mueves código, mueve los marcadores: el build falla si una región no existe.

## Integraciones de la demo ERP

Sin configuración, la demo usa **reglas locales** y un **sandbox** con pedidos ficticios, y la interfaz lo indica como simulación. Las integraciones reales son adaptadores intercambiables por variables de entorno (ver `.env.example`):

| Variable | Valores | Efecto |
| --- | --- | --- |
| `ERP_EXTRACTOR` | `rules` (defecto) · `openai` | `openai` requiere `OPENAI_API_KEY` y `OPENAI_MODEL` (un modelo con salida JSON estricta) |
| `ERP_GATEWAY` | `sandbox` (defecto) · `odoo` | `odoo` requiere `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY` |
| `ODOO_ALLOW_WRITE` | `true` / otro | Sin `true`, el adaptador de Odoo no escribe nunca |

Estado real de cada adaptador:

- `OpenAIExtractor`: implementado (Chat Completions con `response_format: json_schema` estricto, guardarraíl de citas literales). Probado con un transporte falso; **no probado con la API real**.
- `OdooGateway`: implementado (`/jsonrpc`, `execute_kw` sobre `sale.order`, `sale.order.line` y `product.product`; control de versión con `write_date`; `message_post` en el historial). Probado con un transporte falso; **no probado con una instancia real**. Odoo 19 marca JSON-RPC como obsoleto: revisarlo si la instancia es 19+.
- Si el proveedor de IA falla, el pipeline usa las reglas locales y lo avisa en la respuesta.

Las claves solo se leen en el proceso de Python (servidor), nunca llegan al navegador. Para una demo pública, mantén `ERP_GATEWAY=sandbox`.

## DexLab en el iframe

`ProjectPreview` (`src/components/project-preview/`) carga la aplicación solo al pulsar «Probar aquí», con barra de navegador, anchos de prueba reales (ajustar, 768 y 390 px), «Ampliar» sin recargar y «Abrir aplicación» siempre visible. Si la carga tarda más de 10 s, ofrece reintentar o abrirla aparte: el evento `load` no detecta todos los bloqueos.

- DexLab no envía `X-Frame-Options` ni `frame-ancestors` (comprobado el 12/10/2026), por eso se puede incrustar.
- El portfolio limita `frame-src` a `https://pokedex-ia-nu.vercel.app` y no puede ser incrustado (`frame-ancestors 'none'`). Ver `next.config.ts`.
- `sandbox` del iframe: `allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads`. Sin `allow-top-navigation`: la app no puede redirigir el portfolio. `allow="clipboard-write"` para la exportación de equipos.

## SEO

- Metadatos por página con `pageMetadata()` (`src/lib/seo.tsx`): título, descripción, URL canónica, Open Graph y Twitter.
- Imágenes Open Graph generadas en el build: una general (`src/app/opengraph-image.tsx`) y una por caso (`src/app/proyectos/[slug]/opengraph-image.tsx`).
- Datos estructurados JSON-LD: `Person` (puesto, habilidades, idiomas, formación, LinkedIn y GitHub), `WebSite` y `ProfilePage` en la portada; `BreadcrumbList` en casos y demos; `SoftwareApplication` en DexLab.
- `sitemap.xml` con prioridades, `robots.txt`, manifiesto web, icono SVG y `apple-icon`.
- Todas las páginas son estáticas (HTML prerenderizado) y las imágenes pasan por `next/image`.
- Google Search Console: define `GOOGLE_SITE_VERIFICATION` en Vercel y envía `https://<dominio>/sitemap.xml`.

## Despliegue (Vercel)

1. Importa el repositorio en Vercel (framework: Next.js). `vercel.json` registra `api/erp.py` como función Python e incluye `erp_service/`.
2. Variables: ninguna obligatoria. La URL pública se toma de `VERCEL_PROJECT_PRODUCTION_URL`; con un dominio propio, define `NEXT_PUBLIC_SITE_URL`. No definas `ERP_SERVICE_URL` (en Vercel `/api/erp` lo sirve la función Python). La función está en la región `cdg1` (París).
3. Tras desplegar, comprueba `https://<dominio>/api/erp?op=health` → `{"extractor": {"name": "reglas-v1", …}}` y prueba la demo ERP.

En otro alojamiento: despliega el servicio con `python -m erp_service.server <puerto>` detrás de un proxy y haz el build con `ERP_SERVICE_URL` apuntando a él.

## Comprobaciones

Ver [docs/VERIFICACION.md](docs/VERIFICACION.md) (qué se ha ejecutado y con qué resultado) y [docs/PENDIENTES.md](docs/PENDIENTES.md) (material y decisiones pendientes).
