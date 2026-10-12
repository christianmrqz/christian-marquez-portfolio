/**
 * Composición de la portada: el recorrido de la demo ERP (interfaz → API → servicio Python → registro de Odoo),
 * dibujado como un esquema técnico. SVG estático: las líneas «fluyen» solo con CSS y se detienen
 * con prefers-reduced-motion. Los datos son los mismos registros ficticios de la demo.
 */

function Node({ x, y, w = 160, label, title, dashed = false }: { x: number; y: number; w?: number; label: string; title: string; dashed?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="64" rx="10" className="fill-graphite-2" stroke="#3a3d46" strokeDasharray={dashed ? "4 4" : undefined} />
      <text x="14" y="25" className="fill-blue-soft font-mono" fontSize="10.5" letterSpacing="1">
        {label}
      </text>
      <text x="14" y="46" className="fill-ivory" fontSize="14" fontWeight="500">
        {title}
      </text>
    </g>
  );
}

const flow = "stroke-blue-soft motion-safe:animate-flow";

export function IntegrationDiagram() {
  return (
    <figure className="on-dark relative overflow-hidden rounded-[1.75rem] bg-graphite p-3 text-ivory shadow-[0_30px_80px_-40px_rgba(23,24,28,0.6)] sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#3a3d46_1px,transparent_1px)] [background-size:18px_18px]"
      />
      <svg
        viewBox="0 0 400 452"
        role="img"
        aria-labelledby="diagram-title diagram-desc"
        className="relative h-auto w-full font-sans"
      >
        <title id="diagram-title">Esquema de integración</title>
        <desc id="diagram-desc">
          La interfaz envía una solicitud a una API. Un servicio en Python la convierte en datos estructurados con reglas o con un modelo
          opcional, la valida y propone un cambio en un pedido de Odoo: cantidad de 25 a 40 y fecha de entrega adelantada.
        </desc>

        {/* Conexiones */}
        <g fill="none" strokeWidth="1.5" strokeDasharray="4 8" strokeLinecap="round">
          <path d="M184 56 H216" className={flow} />
          <path d="M296 88 V129 H104 V170" className={flow} />
          <path d="M184 202 H216" className="stroke-muted-dark" strokeDasharray="2 5" />
          <path d="M104 234 V296" className={flow} />
        </g>
        <g className="fill-muted-dark font-mono" fontSize="9.5">
          <text x="112" y="122">POST /api/erp?op=process</text>
          <text x="188" y="194">propone</text>
          <text x="112" y="270">valida → propone</text>
        </g>

        <Node x={24} y={24} label="INTERFAZ" title="React · Vue · TS" />
        <Node x={216} y={24} label="API" title="JSON · contrato" />
        <Node x={24} y={170} label="SERVICIO" title="Python · reglas" />
        <Node x={216} y={170} label="MODELO · OPCIONAL" title="Adaptador OpenAI" dashed />

        {/* Registro del ERP */}
        <g transform="translate(24 296)">
          <rect width="352" height="132" rx="12" className="fill-ivory" />
          <text x="16" y="26" className="fill-muted font-mono" fontSize="10.5" letterSpacing="1">
            ODOO · sale.order
          </text>
          <text x="336" y="26" textAnchor="end" className="fill-graphite font-mono" fontSize="10.5">
            SO-1042
          </text>
          <line x1="16" x2="336" y1="38" y2="38" stroke="#d8d1c2" />
          <g fontSize="12.5" className="fill-graphite">
            <text x="16" y="62">Cantidad · Tornillo M6</text>
            <text x="16" y="88">Fecha de entrega</text>
          </g>
          <g fontSize="12.5" textAnchor="end" className="font-mono">
            <text x="336" y="62">
              <tspan className="fill-muted" textDecoration="line-through">25</tspan>
              <tspan className="fill-muted"> → </tspan>
              <tspan className="fill-blue" fontWeight="600">40</tspan>
            </text>
            <text x="336" y="88">
              <tspan className="fill-muted" textDecoration="line-through">28/10</tspan>
              <tspan className="fill-muted"> → </tspan>
              <tspan className="fill-blue" fontWeight="600">24/10</tspan>
            </text>
          </g>
          <circle cx="22" cy="111" r="4" className="fill-ok motion-safe:animate-pulse" />
          <text x="34" y="115" fontSize="11.5" className="fill-ok" fontWeight="500">
            Propuesta validada · pendiente de confirmar
          </text>
        </g>
      </svg>
      <figcaption className="relative flex flex-wrap items-center justify-between gap-2 px-2 pt-3 text-xs text-muted-dark">
        <span>Recorrido de la demo del laboratorio · datos ficticios</span>
        <a href="/laboratorio/erp-ia" className="link-underline text-ivory">
          Probarlo
        </a>
      </figcaption>
    </figure>
  );
}
