# Verificación

Registro de lo que se ha comprobado, cómo y con qué resultado. Fecha: 12/10/2026. Entorno: Windows 10, Node 21.7.1, Python 3.13.7, Google Chrome (Playwright 1.64, `channel: "chrome"`).

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` (TypeScript estricto, `noUncheckedIndexedAccess`) | Sin errores |
| `npm run lint` (eslint-config-next 16.4) | Sin errores ni avisos |
| `npm test` (Vitest) | 13 tests en verde: estado del dashboard (búsqueda, filtros, orden, edición, validación, carga, resumen) y paleta de comandos |
| `npm run test:py` (unittest) | 24 tests en verde: extractor por reglas, validación, propuesta, adaptadores OpenAI y Odoo con transporte falso, sandbox con control de versión y API HTTP |
| `npm run build` | 14 rutas estáticas, sin avisos |
| `npm run test:e2e` (Playwright contra el build de producción + servicio Python) | 12 tests en verde, dos ejecuciones completas seguidas |
| `api/erp.py` importado fuera del paquete (`python -I`) | Resuelve `erp_service.web.ErpHandler` |

### Recorridos E2E cubiertos

- Portada: nombre, «Ver proyectos», «Contactar», referencia a Telefónica/Movistar y email; el nivel de inglés no aparece.
- Sin scroll horizontal a 360 px en 7 rutas (con los datos ya cargados).
- Teclado: el primer Tab enfoca «Saltar al contenido».
- `prefers-reduced-motion: reduce`: el contenido con animación de entrada es visible (opacidad 1).
- Paleta: Ctrl+K enfoca el buscador, navega con Intro y «Copiar email» deja el email en el portapapeles.
- Metadatos: título por página, `og:image` en los casos, 404 con estado HTTP 404.
- DexLab: no se carga hasta pulsar «Probar aquí»; búsqueda dentro del iframe («drapio» → Drapion) sin cambiar la URL del portfolio; la vista de 390 px da 390 px reales al iframe.
- Demo ERP: ejemplo válido → propuesta 25 → 40 → confirmación → versión 2; ejemplo insuficiente → errores y ninguna propuesta; la pestaña técnica muestra código real.
- Dashboard: búsqueda, edición bloqueada por una regla, guardado reflejado en la tabla y foco devuelto al botón; `aria-sort`; vista de tarjetas; estados sin resultados, error de API y vacío.

## DexLab (aplicación externa)

Comprobado en `https://pokedex-ia-nu.vercel.app/`:

- Cabeceras: sin `X-Frame-Options` ni `Content-Security-Policy` (`curl -I`). Se puede incrustar.
- Las 9 rutas de herramientas responden 200 y cargan sin errores de consola en Chrome (capturas a 1280 px).
- Interacciones: búsqueda con errata, ficha, calculadora de daño con resultados, comparador, creación de un equipo.
- Asistente: `POST /api/assistant` responde con `"mode":"deterministic"` y la interfaz indica «La IA no está configurada en este servidor». **La versión publicada no usa IA.**
- Repositorio `github.com/christianmrqz/pokedex-ia`: público. `npx vitest run` → 127 tests en verde (15 archivos).
- Stack tomado de `package.json` y del código, no deducido del nombre.
- Incrustación verificada visualmente (capturas): carga, navegación interna, vista móvil, ampliación sin recarga, Escape para cerrar.

## Revisión visual

`node scripts/review-screens.mjs` a 390, 768 y 1440 px en las 8 páginas, sin errores de consola. Defectos encontrados y corregidos durante la revisión:

- Bloques invisibles en capturas completas: la animación de entrada partía de opacidad 0 → ahora solo desplaza.
- Dashboard desbordado en móvil (hijos de grid con `min-width: auto` y `span.sr-only` fuera del contenedor con scroll) → `minmax(0,1fr)` y `relative`.
- Cabecera partida a 768 px, póster de DexLab con texto superpuesto y hueco excesivo en casos sin enlaces.

## Lighthouse 12 (móvil simulado, build de producción local)

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 96 | 100 | 100 | 100 | 2,8 s | 0 | 50 ms |
| `/proyectos/dexlab` | 96 | 100 | 100 | 100 | 2,7 s | 0 | 20 ms |
| `/laboratorio/erp-ia` | 95 | 100¹ | 100² | 100 | 2,9 s | 0 | 40 ms |
| `/laboratorio/dashboard` | 97 | 100 | 100 | 100 | 2,7 s | 0 | 50 ms |
| `/vista-rapida` | 97 | 100 | 100 | 100 | 2,6 s | 0 | 40 ms |

¹ La primera medida dio 99 (`heading-order`); tras añadir un `h2` a cada pestaña, 100.
² Con el servicio Python en marcha. Sin él, 96: la petición a `/api/erp` falla, se registra en consola y la demo muestra su estado «servicio no disponible» con «Reintentar».

Son medidas de laboratorio en local, no datos de campo. En Vercel cambiarán (CDN, compresión, red real).

## Lo que no se ha comprobado

- El despliegue en Vercel, incluida la función Python `api/erp.py` (no hay cuenta ni proyecto configurado en este entorno).
- `OpenAIExtractor` contra la API de OpenAI y `OdooGateway` contra una instancia de Odoo (sin claves ni instancia). Solo con transportes falsos.
- Firefox y Safari. El iframe de DexLab en Safari puede tener el almacenamiento particionado de forma distinta (afecta a favoritos y equipos guardados dentro del iframe).
- Lectores de pantalla reales (NVDA, VoiceOver). La semántica se ha revisado en el código y con Lighthouse y Playwright.
- La navegación con flechas de las pestañas «Probar / Cómo está construido» está implementada, pero no tiene test.

## Segunda ronda (contenido confirmado, RequestFlow y SEO)

- RequestFlow AI (repositorio local `~/requestflow-ai`): tests del núcleo (13) y de la web (10) en verde, typecheck limpio. Los tests de la API no se han ejecutado (necesitan PostgreSQL en Docker, que no estaba activo). Las cifras de la evaluación (reglas v2: 100 % en entrenamiento, 50 % en test con 14 casos) proceden de `.claude/hillclimb/extraction/v1/change.md` del propio proyecto; no se volvió a ejecutar la evaluación para no escribir en ese repositorio. No hay clave de Anthropic configurada: la ruta con Claude no se ha ejecutado contra la API real.
- E2E ampliadas: inglés C1 y teléfono visibles; URL canónica, imagen Open Graph propia y JSON-LD `SoftwareApplication` en `/proyectos/dexlab`; sin scroll horizontal también en `/proyectos/requestflow`. 12 tests en verde.
- `npm run check` y `next build` sin errores.
- Lighthouse no se ha repetido tras esta ronda; se medirá sobre el despliegue en Vercel.
