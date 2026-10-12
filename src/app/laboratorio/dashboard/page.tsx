import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { DashboardDemo } from "@/components/dashboard/dashboard-demo";
import { BuildSection, CodeRegion, Decisions, StatusTable } from "@/components/lab/build-blocks";
import { DemoTabs } from "@/components/lab/demo-tabs";
import { LabHeader } from "@/components/lab/lab-header";
import { countTests } from "@/lib/source";

export const metadata: Metadata = pageMetadata({
  title: "Demo · Dashboard en React",
  description: "Panel de incidencias en React y TypeScript: búsqueda, filtros, orden, tabla o tarjetas, edición validada, temas del sistema de diseño y estados vacío y de error.",
  path: "/laboratorio/dashboard",
});

const decisions = [
  {
    title: "useReducer con un reducer puro",
    body: "Todas las transiciones (cargar, filtrar, ordenar, editar) pasan por una función sin React. Se prueba con Vitest y el componente solo despacha acciones.",
    alternative: "Varios useState repartidos por los componentes: más directo al principio, pero las reglas quedan dispersas y no se pueden probar aisladas.",
  },
  {
    title: "Datos derivados con selectores, no copiados",
    body: "La lista visible y el resumen se calculan a partir de las incidencias y los filtros en cada render. No hay un segundo estado que pueda desincronizarse.",
    alternative: "Guardar la lista filtrada en el estado: obliga a recalcularla a mano en cada cambio y es fácil olvidar un caso.",
  },
  {
    title: "Temas con variables CSS",
    body: "Los componentes solo usan tokens (--d-surface, --d-accent…). Cambiar de tema o de densidad cambia un atributo del contenedor; no se re-renderiza ningún componente por estilo.",
    alternative: "Clases condicionales por tema en cada componente: tres veces más estilos y riesgo de olvidar uno.",
  },
  {
    title: "Las reglas de edición viven junto al estado",
    body: "validatePatch() se usa en el formulario para mostrar errores y en el reducer para no aceptar nunca un registro inválido.",
    alternative: "Validar solo en el formulario: cualquier otra vía de edición podría guardar datos incoherentes.",
  },
];

export default function DashboardPage() {
  const tests = countTests(["src/lib/dashboard/state.test.ts"]);
  return (
    <>
      <LabHeader
        path="/laboratorio/dashboard"
        kicker="Demo B · Dashboard y componentes"
        title={
          <>
            Un panel para leer rápido <span className="font-serif font-normal italic text-blue">y actuar con control.</span>
          </>
        }
        intro="Incidencias de soporte ficticias. Busca, filtra, ordena, cambia de vista, edita un registro y prueba los estados vacío y de error con los controles de la demo."
        badges={["Datos ficticios con latencia simulada", "Los cambios se pierden al recargar la página"]}
      />
      <div className="container-page pb-24">
        <DemoTabs
          tryPanel={<DashboardDemo />}
          buildPanel={
            <div className="grid gap-10">
              <BuildSection title="Qué demuestra">
                <StatusTable
                  rows={[
                    { part: "Gestión de estado", status: "Reducer puro", tone: "active", detail: `src/lib/dashboard/state.ts, con ${tests} tests de Vitest.` },
                    { part: "Componentes", status: "Reutilizables", tone: "active", detail: "Badge, Select, Segmented, EmptyPanel y el diálogo de edición se comparten entre vistas." },
                    { part: "Accesibilidad", status: "Teclado y lector", tone: "active", detail: "aria-sort en cabeceras, aria-pressed en filtros, <dialog> nativo con foco devuelto, región aria-live con el recuento." },
                    { part: "Responsive", status: "Desde 360 px", tone: "active", detail: "La tabla oculta columnas secundarias y las muestra bajo el asunto; las tarjetas se reorganizan en 1, 2 o 3 columnas." },
                    { part: "API", status: "Simulada", tone: "simulated", detail: "fetchTickets() devuelve datos fijos con 500 ms de espera, una lista vacía o un error 503 según el escenario." },
                  ]}
                />
              </BuildSection>
              <BuildSection title="Recorrido de los datos">
                <ol className="grid gap-2 text-sm">
                  <li>
                    <span className="font-mono text-xs text-blue">1</span> El escenario elegido dispara <code className="font-mono">fetchTickets()</code>; el reducer pasa por <em>loading</em> y termina en <em>ready</em> o <em>error</em>.
                  </li>
                  <li>
                    <span className="font-mono text-xs text-blue">2</span> Búsqueda, filtros y orden solo cambian el estado; <code className="font-mono">selectVisible()</code> deriva la lista en cada render.
                  </li>
                  <li>
                    <span className="font-mono text-xs text-blue">3</span> Editar abre un <code className="font-mono">&lt;dialog&gt;</code>; al guardar, <code className="font-mono">validatePatch()</code> decide y el reducer actualiza la incidencia, el resumen y el resaltado.
                  </li>
                </ol>
              </BuildSection>
              <BuildSection title="Decisiones técnicas">
                <Decisions items={decisions} />
              </BuildSection>
              <BuildSection title="Código relevante">
                <div className="grid gap-5">
                  <CodeRegion file="src/lib/dashboard/state.ts" region="selectores" caption="Selectores: lista visible y resumen" />
                  <CodeRegion file="src/lib/dashboard/state.ts" region="reducer" caption="Reducer: todas las transiciones" />
                  <CodeRegion file="src/components/dashboard/dashboard-demo.tsx" region="tabla" caption="Tabla con orden accesible (aria-sort)" />
                </div>
              </BuildSection>
            </div>
          }
        />
      </div>
    </>
  );
}
