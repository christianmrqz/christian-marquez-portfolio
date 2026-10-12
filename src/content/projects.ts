/**
 * Casos de proyecto. Cada afirmación debe poder comprobarse:
 * - DexLab: repositorio público, aplicación publicada y tests (verificado el 12/10/2026, ver docs/VERIFICACION.md).
 * - RequestFlow AI: repositorio local (aún sin publicar); tests de core y web ejecutados, evaluación según el propio proyecto.
 * - Movistar y Odoo: CV y explicaciones de Christian (12/10/2026). Son trabajos privados: sin código, capturas ni datos.
 */

export const DEXLAB_URL = "https://pokedex-ia-nu.vercel.app/";
export const DEXLAB_REPO = "https://github.com/christianmrqz/pokedex-ia";

export type CaseKind = "Proyecto personal publicado" | "Proyecto personal en desarrollo" | "Experiencia profesional";

export type CaseLink = { label: string; href: string; external?: boolean };

export type CaseStudy = {
  slug: "dexlab" | "requestflow" | "movistar" | "odoo-ia";
  title: string;
  kicker: string;
  kind: CaseKind;
  period: string;
  summary: string;
  tags: string[];
  links: CaseLink[];
  /** Aviso sobre el origen y los límites de la información (trabajo privado, reconstrucción…). */
  note?: string;
  problem: string;
  contribution: string[];
  stack: { name: string; why: string }[];
  decision: { label: string; title: string; chosen: string; alternatives: { option: string; tradeoff: string }[] };
  difficulties: string[];
  outcome: { label: "Resultado verificable" | "Aprendizaje" | "Estado y aprendizaje"; points: string[] };
};

export const cases: CaseStudy[] = [
  {
    slug: "dexlab",
    title: "DexLab",
    kicker: "Pokédex inteligente",
    kind: "Proyecto personal publicado",
    period: "2026",
    summary:
      "Aplicación web que explica cualquier enfrentamiento Pokémon: debilidades exactas por generación, estadísticas, movimientos por juego, daño y equipos. Datos reales de PokéAPI y cálculos deterministas cubiertos por tests.",
    tags: ["Next.js 16", "React 19", "TypeScript", "PokéAPI", "@smogon/calc", "Vitest"],
    links: [
      { label: "Abrir aplicación", href: DEXLAB_URL, external: true },
      { label: "Repositorio", href: DEXLAB_REPO, external: true },
    ],
    problem:
      "Para saber cómo ganar un combate hay que cruzar la tabla de tipos, las estadísticas, los movimientos que un Pokémon aprende en un juego concreto y fórmulas que cambian entre generaciones. Esa información está repartida en muchas fuentes y casi nunca se presenta según el juego al que estás jugando.",
    contribution: [
      "Proyecto personal: definición del producto, diseño de la interfaz, desarrollo y despliegue en Vercel.",
      "Script que genera índices estáticos a partir de PokéAPI (GraphQL más complementos REST) para buscar y filtrar sin descargar miles de fichas.",
      "Motores de cálculo puros (tipos, estadísticas, daño, estrategia, equipos) separados de React y de la red, con 127 tests.",
      "Asistente que interpreta la pregunta y responde con los hechos calculados, sin IA. El código admite pasar esos hechos a un modelo de lenguaje, pero lo dejé desactivado.",
    ],
    stack: [
      { name: "Next.js 16 (App Router)", why: "Fichas renderizadas en el servidor con caché, rutas indexables y metadatos por Pokémon." },
      { name: "TypeScript estricto + Zod", why: "Tipos de dominio compartidos y validación de las peticiones al asistente." },
      { name: "PokéAPI", why: "Fuente pública de datos. Se consulta al generar los índices y, con caché, al abrir cada ficha." },
      { name: "@smogon/calc", why: "Motor de daño de Pokémon Showdown: se usa en lugar de reimplementar la fórmula y para contrastar la tabla de tipos." },
      { name: "TanStack Query", why: "Carga bajo demanda del índice de búsqueda y de los movimientos en el navegador." },
      { name: "Vitest", why: "Tests de los motores con casos conocidos y datos reales guardados como fixtures." },
    ],
    decision: {
      label: "Decisión técnica",
      title: "Índices estáticos generados desde PokéAPI",
      chosen:
        "Un script consulta PokéAPI una vez y genera índices ligeros (Pokémon, movimientos, habilidades, tipos por generación). La búsqueda, los filtros y el motor de tipos funcionan al instante; las fichas completas se piden en el servidor y se cachean.",
      alternatives: [
        { option: "Consultar PokéAPI desde el navegador en cada búsqueda", tradeoff: "Cientos de peticiones para filtrar y más presión sobre una API pública con política de uso justo." },
        { option: "Base de datos propia", tradeoff: "Más infraestructura que mantener para unos datos que cambian pocas veces al año." },
      ],
    },
    difficulties: [
      "Los datos cambian según la generación: tipos históricos (Clefairy era Normal antes de la Gen 6), tablas de tipos distintas y valores de movimientos que se ajustaron con el tiempo.",
      "Algunas formas recientes no tienen nombre en español en PokéAPI y tres no tienen equivalente en @smogon/calc; la interfaz lo indica en lugar de inventar datos.",
    ],
    outcome: {
      label: "Resultado verificable",
      points: [
        "Aplicación publicada con nueve herramientas navegables; la búsqueda, la ficha, las calculadoras, el comparador y los equipos responden en producción.",
        "127 tests en verde, incluida la tabla de tipos comparada celda a celda con @smogon/calc en las 9 generaciones.",
        "La IA no está activada, por decisión: los datos y los cálculos deterministas ya contienen la respuesta completa, sin coste por consulta y sin riesgo de que un modelo invente.",
      ],
    },
  },
  {
    slug: "movistar",
    title: "Área privada de Movistar",
    kicker: "Dispositivos del hogar · Telefónica",
    kind: "Experiencia profesional",
    period: "sep 2022 – sep 2023",
    summary:
      "Migración del área privada de Movistar a una tecnología y un diseño compartidos. Me encargué de la sección donde el cliente gestiona los dispositivos de su hogar: teléfonos contratados, dispositivos financiados con promociones, lo que queda por pagar y los recibos.",
    tags: ["React", "Redux-Saga", "JavaScript", "Sass", "Scrum"],
    links: [],
    note: "Proyecto interno de Telefónica. Esta página describe mi participación; no incluye código, capturas ni datos del proyecto.",
    problem:
      "Toda la información de cada cliente salía de un sistema central de Movistar. Esos datos eran tediosos de leer y no estaban pensados para una interfaz: para mostrar qué dispositivos tiene el cliente, cuánto le queda por pagar de cada uno y sus recibos había que interpretarlos y traducirlos a lo que necesitaba cada pantalla, dentro de la tecnología y el diseño comunes de la migración.",
    contribution: [
      "Sección de dispositivos del hogar del área privada: teléfonos contratados y dispositivos con financiación por promoción.",
      "Importe pendiente de cada dispositivo y recibos asociados.",
      "Lectura e interpretación de los datos del sistema central de cada cliente para convertirlos en la información que muestra la interfaz.",
      "Desarrollo con React, Redux-Saga y JavaScript, integración de APIs backend y componentes reutilizables con Sass.",
      "Trabajo en equipo con Scrum durante la renovación.",
    ],
    stack: [
      { name: "React", why: "Base de la interfaz compartida sobre la que se reconstruían las pantallas." },
      { name: "Redux-Saga", why: "Gestiona los efectos asíncronos, como las llamadas a las APIs backend, fuera de los componentes." },
      { name: "Sass", why: "Estilos de componentes reutilizables alineados con el diseño común." },
      { name: "Scrum", why: "Organización del trabajo del equipo por iteraciones durante la migración." },
    ],
    decision: {
      label: "Decisión técnica del proyecto",
      title: "Adaptar cada funcionalidad a la base compartida",
      chosen:
        "La migración no trasladó cada pantalla tal cual: adaptó funcionalidades y layouts a la tecnología y al diseño comunes. En mi sección, eso implicaba presentar los datos de dispositivos, pagos y recibos con los componentes y reglas del sistema compartido.",
      alternatives: [
        { option: "Trasladar las pantallas con su diseño propio", tradeoff: "Habría sido más rápido al principio, pero el área privada habría seguido con un sistema visual y técnico distinto al del resto de proyectos." },
        { option: "Mantener la implementación anterior", tradeoff: "Evitaba el coste de migrar, pero dejaba el área privada fuera de la base común." },
      ],
    },
    difficulties: [
      "El mayor reto: los datos del sistema central. Eran difíciles de leer y había que traducirlos a lo que necesitaba cada vista (dispositivos, importes pendientes, recibos) a partir de la información principal de cada cliente.",
      "Conservar el comportamiento de cada funcionalidad mientras cambian la tecnología y el diseño que la sostienen.",
    ],
    outcome: {
      label: "Aprendizaje",
      points: [
        "Trabajar con datos de un sistema central que no está pensado para la interfaz: entenderlos bien antes de decidir cómo mostrarlos al cliente.",
        "Desarrollar sobre una base compartida: reutilizar componentes en lugar de crear variantes, integrar APIs backend existentes y entregar por sprints.",
      ],
    },
  },
  {
    slug: "odoo-ia",
    title: "Odoo + API de OpenAI",
    kicker: "Integraciones de IA en el ERP",
    kind: "Experiencia profesional",
    period: "jul 2023 – actualidad",
    summary:
      "Tres años desarrollando para Odoo, hasta su versión más reciente: módulos que envían datos y documentos de clientes a la API de OpenAI y llevan el resultado al ERP, y módulos a medida conectados con Make y flujos de trabajo.",
    tags: ["Python", "Odoo", "API de OpenAI", "Make", "APIs REST"],
    links: [{ label: "Probar la reconstrucción", href: "/laboratorio/erp-ia" }],
    note: "Trabajo para clientes privados: sin nombres, código ni datos. La demo enlazada es una reconstrucción propia, con datos ficticios, de este tipo de flujo.",
    problem:
      "Las empresas recibían información que había que introducir a mano en el ERP, como PDFs que enviaban sus clientes, y tenían procesos propios que Odoo no cubría de serie. Necesitaban que esos documentos pasaran por un modelo de lenguaje y acabaran como registros en Odoo, y que el ERP hiciera exactamente lo que requería su forma de trabajar.",
    contribution: [
      "PDFs enviados por clientes, como presupuestos, procesados con la API de OpenAI e incorporados directamente a Odoo a partir de la respuesta.",
      "Módulos de Odoo en Python que preparan los datos, llaman a la API y actualizan campos y registros del ERP.",
      "Módulos a medida programados para los procesos de cada empresa, conectados con Make y flujos de trabajo automatizados.",
      "Análisis de requisitos con cada cliente: qué entra, qué se espera recibir y qué registros cambian.",
    ],
    stack: [
      { name: "Python", why: "Es el lenguaje de los módulos de Odoo: la integración vive dentro del ERP." },
      { name: "Odoo", why: "ERP del cliente y fuente de verdad: modelos, campos y registros. He trabajado con varias versiones, hasta la más reciente." },
      { name: "API de OpenAI", why: "Extrae y estructura la información de documentos y textos que las reglas fijas no resuelven bien." },
      { name: "Make", why: "Orquesta flujos de trabajo entre Odoo y otros servicios sin programar cada conexión a mano." },
    ],
    decision: {
      label: "Decisión aplicada en la reconstrucción",
      title: "El modelo propone; el código valida y el ERP decide",
      chosen:
        "En la demo, la salida del extractor se convierte en datos estructurados, se valida con reglas de negocio contra el registro real y se presenta como propuesta de cambios antes de escribir nada.",
      alternatives: [
        { option: "Escribir la respuesta del modelo directamente en el ERP", tradeoff: "Menos pasos, pero un error del modelo llega a un registro de negocio sin control." },
        { option: "Solo reglas, sin modelo", tradeoff: "Resultado predecible y sin coste por petición, pero frágil ante documentos y textos redactados libremente." },
      ],
    },
    difficulties: [
      "Una respuesta de un modelo de lenguaje no es un dato de ERP: hay que procesarla antes de que toque un campo.",
      "Cada empresa tiene su propio proceso; el mismo patrón de integración se adapta a modelos, campos y flujos distintos.",
    ],
    outcome: {
      label: "Aprendizaje",
      points: [
        "Una integración con IA en un ERP es sobre todo trabajo de integración: preparar los datos, interpretar las respuestas y escribir en el registro correcto.",
        "La reconstrucción del laboratorio muestra ese recorrido con código ejecutable y tests, sin claves ni una instancia de Odoo.",
      ],
    },
  },
  {
    slug: "requestflow",
    title: "RequestFlow AI",
    kicker: "Solicitudes comerciales con IA y revisión humana",
    kind: "Proyecto personal en desarrollo",
    period: "2026",
    summary:
      "Plataforma para gestionar solicitudes comerciales escritas en lenguaje natural: un análisis extrae tipo, cliente, producto, cantidad, fecha y prioridad, detecta lo que falta y una persona revisa el resultado antes de guardarlo. Cada corrección queda en el historial.",
    tags: ["React 19", "Express 5", "PostgreSQL", "Prisma", "Zod", "API de Claude"],
    links: [],
    note: "En desarrollo y todavía sin publicar. Lo que se cuenta aquí procede del código y de la evaluación del propio proyecto.",
    problem:
      "Las solicitudes de clientes llegan por escrito y con redacciones muy distintas. Pasarlas a mano a un sistema es lento; automatizarlo con IA sin control puede introducir datos inventados en registros de negocio.",
    contribution: [
      "Monorepo con un núcleo compartido (esquemas Zod, reglas de negocio y contratos HTTP) que usan la API y la web, de modo que las mismas reglas se aplican en los dos extremos.",
      "API REST con Express 5, PostgreSQL y Prisma: escrituras e historial en la misma transacción, bloqueo de fila al editar y búsqueda sin tildes con índice pg_trgm.",
      "Análisis con la API de Claude con salida JSON estructurada y un motor de reglas determinista intercambiable.",
      "Guardarraíles en el servidor: un valor solo se acepta si su evidencia aparece literalmente en el texto original.",
      "Evaluación con 41 solicitudes etiquetadas en 7 categorías, incluida la inyección de instrucciones, separadas en entrenamiento y test.",
    ],
    stack: [
      { name: "React 19 + Vite + TanStack Query", why: "Interfaz de revisión y panel; el cliente HTTP valida las respuestas con los mismos esquemas que la API." },
      { name: "Express 5 + PostgreSQL + Prisma", why: "Datos relacionales con transacciones, migraciones versionadas e índices para búsqueda y agregados del panel." },
      { name: "Zod", why: "Un único contrato, validado en la entrada de la API y en las respuestas que recibe la web." },
      { name: "API de Claude", why: "Extracción de campos en textos libres, con salida estructurada y reintentos ante errores temporales." },
    ],
    decision: {
      label: "Decisión técnica",
      title: "«No inventar datos» se comprueba en el servidor, no se confía al prompt",
      chosen:
        "El modelo devuelve cada campo con su evidencia literal y una confianza. El servidor descarta cualquier valor cuya evidencia no aparezca en el texto, valida fechas y cantidades y recalcula la información que falta con las reglas compartidas. Lo descartado se explica en los avisos.",
      alternatives: [
        { option: "Pedirlo solo en el prompt", tradeoff: "Más sencillo, pero no verificable: un error del modelo llegaría a la base de datos." },
        { option: "Solo reglas, sin modelo", tradeoff: "Predecible y gratuito, pero la evaluación muestra que generaliza mal a redacciones nuevas." },
      ],
    },
    difficulties: [
      "Las reglas se sobreajustan: tras mejorarlas, el motor de reglas acierta el 100 % de los casos de entrenamiento, pero solo el 50 % de los de test (14 casos, con un margen de ruido de unos ±27 puntos).",
      "Resolver «mañana» o «el viernes» en el calendario de quien escribe, no en el del servidor.",
    ],
    outcome: {
      label: "Estado y aprendizaje",
      points: [
        "Implementados: API, web, motor de reglas, integración con Claude y evaluación. Los tests del núcleo (13) y de la web (10) pasan; los de la API necesitan PostgreSQL.",
        "La integración con Claude está probada con un transporte falso; la comparación con el modelo real está preparada, pero todavía no se ha ejecutado.",
        "Medir con un conjunto de test separado es lo que evita engañarse: la diferencia entre entrenamiento y test es el argumento cuantitativo para usar un modelo de lenguaje.",
      ],
    },
  },
];

export function getCase(slug: string) {
  return cases.find((c) => c.slug === slug);
}

/** Capacidades de DexLab comprobadas en producción (12/10/2026). «sin-ia» = funciona sin IA por decisión. */
export const dexlabCapabilities: { name: string; route: string; status: "verificado" | "sin-ia"; note: string }[] = [
  { name: "Buscador", route: "/", status: "verificado", note: "Tolera erratas: «drapio» abre la ficha de Drapion." },
  { name: "Ficha de Pokémon", route: "/pokemon/drapion", status: "verificado", note: "Debilidades en modo rápido y avanzado, estadísticas, estrategia, movimientos y evoluciones." },
  { name: "Explorador", route: "/pokedex", status: "verificado", note: "Listado con filtros sobre los índices estáticos." },
  { name: "Tipos", route: "/tipos", status: "verificado", note: "Calculadora de efectividad según la generación elegida." },
  { name: "Estadísticas", route: "/calculadora/estadisticas", status: "verificado", note: "IV, EV y naturaleza; fórmulas de Gen 1-2 y Gen 3+." },
  { name: "Daño", route: "/calculadora/dano", status: "verificado", note: "Rangos y probabilidad de KO calculados con @smogon/calc." },
  { name: "Comparador", route: "/comparador", status: "verificado", note: "Dos Pokémon cara a cara con estadísticas base y reales." },
  { name: "Equipos", route: "/equipos", status: "verificado", note: "Hasta seis Pokémon, análisis y exportación a Showdown. Se guardan solo en el navegador." },
  { name: "Asistente", route: "/asistente", status: "sin-ia", note: "Responde con los datos calculados. La IA no está activada: los cálculos ya dan la respuesta completa." },
];

/** Separación de responsabilidades en DexLab, comprobada en el repositorio. */
export const dexlabLayers = [
  {
    name: "Datos",
    what: "Índices estáticos generados desde PokéAPI y fichas pedidas en el servidor con caché. Si PokéAPI no responde, la ficha muestra lo que hay en el índice local.",
    where: "scripts/build-data.ts · src/lib/pokeapi · src/data/generated",
  },
  {
    name: "Cálculo determinista",
    what: "Funciones puras sin React ni red: tabla de tipos por generación, estadísticas, daño (envoltorio de @smogon/calc), estrategia, cobertura y equipos.",
    where: "src/lib/engine · 127 tests",
  },
  {
    name: "IA, no activada",
    what: "El asistente interpreta la pregunta y calcula los hechos sin IA. El código puede pasar esos hechos a un modelo para redactarlos, pero está desactivado a propósito: los cálculos ya contienen la respuesta.",
    where: "src/lib/assistant · src/app/api/assistant",
  },
] as const;

export const dexlabLimitations = [
  "Los rivales y sugerencias de equipo se basan en tipos y estadísticas base, no en movimientos concretos (la interfaz lo indica).",
  "La interfaz está en español; hay diccionarios en inglés, pero todavía no hay selector de idioma.",
  "La redacción con IA del asistente está implementada, pero no se ha probado con una clave real porque no está activada.",
  "No hay tests de extremo a extremo; las interacciones se han comprobado manualmente y con scripts de navegador.",
];
