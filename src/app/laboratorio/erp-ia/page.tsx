import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ErpDemo } from "@/components/erp/erp-demo";
import { BuildSection, CodeRegion, Decisions, StatusTable } from "@/components/lab/build-blocks";
import { DemoTabs } from "@/components/lab/demo-tabs";
import { LabHeader } from "@/components/lab/lab-header";
import { countTests } from "@/lib/source";

export const metadata: Metadata = pageMetadata({
  title: "Demo · Solicitud → ERP con IA",
  description: "Un mensaje de cliente se convierte en datos estructurados, se valida contra un pedido y se propone como cambio en el ERP. Servicio Python con adaptadores para la API de OpenAI y Odoo.",
  path: "/laboratorio/erp-ia",
});

const flow = [
  { where: "Navegador", what: "El componente React envía el texto, la fecha local y el estado del sandbox.", code: "src/components/erp/erp-demo.tsx" },
  { where: "API", what: "POST /api/erp?op=process. En local lo reenvía Next.js; en Vercel es una función Python.", code: "erp_service/web.py · api/erp.py" },
  { where: "Extracción", what: "Reglas locales por defecto. Con configuración, la API de OpenAI con salida JSON estricta.", code: "adapters/rules_extractor.py · openai_extractor.py" },
  { where: "Validación", what: "Reglas de negocio contra el pedido: existe, es del cliente, admite cambios, cantidades y fechas válidas.", code: "erp_service/validate.py" },
  { where: "Propuesta", what: "Diferencias campo a campo con la versión del registro. Solo si no hay errores.", code: "validate.propose()" },
  { where: "Aplicación", what: "Tras confirmar: op=apply. El adaptador comprueba la versión y escribe. Sandbox u Odoo (JSON-RPC).", code: "adapters/sandbox_gateway.py · odoo_gateway.py" },
];

const decisions = [
  {
    title: "Puertos y adaptadores para la IA y el ERP",
    body: "El pipeline solo conoce dos interfaces: Extractor y ErpGateway. Cambiar de reglas a OpenAI, o del sandbox a Odoo, es configuración, no código nuevo en el flujo.",
    alternative: "Llamar a OpenAI y a Odoo directamente desde el flujo: menos archivos, pero imposible de probar sin claves ni de ejecutar como demo pública.",
  },
  {
    title: "La validación no depende de quién extrae",
    body: "Las reglas de negocio se aplican igual a la salida de las reglas locales y a la de un modelo. El modelo no puede saltarse que un pedido entregado no admite cambios.",
    alternative: "Pedir al modelo que valide: el resultado dependería del prompt y no sería verificable con tests.",
  },
  {
    title: "Proponer antes de escribir, con control de versión",
    body: "La respuesta es una propuesta con valores actuales y nuevos. Al confirmar, el adaptador comprueba que el registro no ha cambiado (versión en el sandbox, write_date en Odoo).",
    alternative: "Escribir directamente: un error de extracción o un cambio simultáneo llegaría al registro sin que nadie lo revise.",
  },
  {
    title: "Servicio sin estado y sin dependencias",
    body: "Solo biblioteca estándar de Python, para desplegarse como función serverless. El estado del sandbox vive en el navegador de cada visitante y viaja en cada petición.",
    alternative: "FastAPI más una base de datos: más cómodo de ampliar, pero excesivo para una demo y con datos compartidos entre visitantes.",
  },
];

export default function ErpDemoPage() {
  const tests = countTests(["erp_service/tests/test_rules.py", "erp_service/tests/test_adapters.py"]);
  return (
    <>
      <LabHeader
        path="/laboratorio/erp-ia"
        kicker="Demo A · Integración ERP e IA"
        title={
          <>
            De un mensaje de cliente <span className="font-serif font-normal italic text-blue">a un cambio en el ERP.</span>
          </>
        }
        intro="Reconstrucción propia del tipo de flujo que desarrollo con Odoo: el texto se estructura, se valida contra el pedido y se propone como cambio que tú confirmas. Todos los registros son ficticios."
        badges={["Extracción por reglas locales: simulación del paso de IA", "ERP simulado con pedidos ficticios: no es una conexión con Odoo"]}
      />
      <div className="container-page pb-24">
        <DemoTabs
          tryPanel={
            <div className="rounded-[1.75rem] bg-[#f5f7fa] p-3 sm:p-6">
              <ErpDemo />
            </div>
          }
          buildPanel={
            <div className="grid gap-10">
              <BuildSection title="Recorrido de los datos">
                <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
                  {flow.map((step, i) => (
                    <li key={step.where} className="grid gap-1 bg-paper p-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
                      <span className="font-medium">
                        <span className="mr-2 font-mono text-xs text-blue">{i + 1}</span>
                        {step.where}
                      </span>
                      <span>
                        <span className="text-sm">{step.what}</span>
                        <span className="mt-1 block font-mono text-xs text-muted">{step.code}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </BuildSection>

              <BuildSection title="Qué es real y qué es simulación">
                <StatusTable
                  rows={[
                    { part: "RulesExtractor", status: "Activo · simulación", tone: "simulated", detail: "Reglas deterministas en Python. No es IA y se presenta como tal." },
                    { part: "SandboxGateway", status: "Activo · simulación", tone: "simulated", detail: "Pedidos ficticios en memoria con el comportamiento básico de sale.order." },
                    { part: "OpenAIExtractor", status: "Implementado · sin probar con la API", tone: "pending", detail: "Probado con un transporte falso. Se activa con ERP_EXTRACTOR=openai." },
                    { part: "OdooGateway", status: "Implementado · sin probar con Odoo", tone: "pending", detail: "JSON-RPC probado con un transporte falso. Escritura desactivada salvo ODOO_ALLOW_WRITE=true." },
                    { part: "Validación y propuesta", status: "Activo · real", tone: "active", detail: `Reglas de negocio cubiertas por ${tests} tests de Python (unittest).` },
                  ]}
                />
              </BuildSection>

              <BuildSection title="Tecnologías">
                <ul className="grid gap-3 text-sm">
                  <li>
                    <strong className="font-medium">Python 3 (biblioteca estándar)</strong> — el lenguaje de Odoo. http.server, urllib, dataclasses y unittest: sin dependencias que instalar.
                  </li>
                  <li>
                    <strong className="font-medium">Next.js + React</strong> — la página es un componente de servidor; solo la demo es un componente de cliente con useReducer.
                  </li>
                  <li>
                    <strong className="font-medium">Vercel Python runtime</strong> — api/erp.py expone el mismo handler que el servidor local.
                  </li>
                </ul>
              </BuildSection>

              <BuildSection title="Decisiones técnicas">
                <Decisions items={decisions} />
              </BuildSection>

              <BuildSection title="Código relevante">
                <div className="grid gap-5">
                  <CodeRegion file="erp_service/ports.py" region="puertos" caption="Los dos puertos que conoce el pipeline" />
                  <CodeRegion file="erp_service/pipeline.py" region="pipeline" caption="Extraer → validar → proponer, con respaldo si falla la IA" />
                  <CodeRegion file="erp_service/validate.py" region="reglas" caption="Reglas sobre el pedido" />
                  <CodeRegion file="erp_service/adapters/openai_extractor.py" region="guardarrail" caption="Guardarraíl: cada cambio debe citar el texto" />
                  <CodeRegion file="erp_service/adapters/sandbox_gateway.py" region="concurrencia" caption="Control de versión al aplicar" />
                </div>
              </BuildSection>

              <BuildSection title="Relación con mi experiencia">
                <p className="max-w-2xl text-sm text-muted">
                  Es una reconstrucción, no código de clientes. Reproduce el patrón descrito en el caso{" "}
                  <Link href="/proyectos/odoo-ia" className="link-underline text-graphite">
                    Odoo + API de OpenAI
                  </Link>
                  : datos que salen del ERP, pasan por un modelo y vuelven como campos actualizados.
                </p>
              </BuildSection>
            </div>
          }
        />
      </div>
    </>
  );
}
