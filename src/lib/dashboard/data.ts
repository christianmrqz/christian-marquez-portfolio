/** Incidencias ficticias del panel. Ningún cliente ni responsable corresponde a una persona o empresa real. */

export const STATUSES = ["abierta", "en_curso", "en_espera", "resuelta"] as const;
export const PRIORITIES = ["baja", "media", "alta", "critica"] as const;
export const ASSIGNEES = ["Sin asignar", "Lucía", "Pablo", "Marta", "Iván"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Assignee = (typeof ASSIGNEES)[number];

export type Ticket = {
  id: string;
  subject: string;
  customer: string;
  status: Status;
  priority: Priority;
  assignee: Assignee;
  /** Días desde la última actualización (relativo, para que los datos no envejezcan). */
  updatedDaysAgo: number;
};

export const STATUS_LABELS: Record<Status, string> = { abierta: "Abierta", en_curso: "En curso", en_espera: "En espera", resuelta: "Resuelta" };
export const PRIORITY_LABELS: Record<Priority, string> = { baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica" };

type Row = [string, string, Status, Priority, Assignee, number];

const ROWS: Row[] = [
  ["No llega el correo de confirmación de pedido", "Ferretería Alameda", "abierta", "alta", "Sin asignar", 0],
  ["Factura duplicada en octubre", "Talleres Ribera", "en_curso", "media", "Lucía", 1],
  ["Error al exportar el informe de ventas a CSV", "Reformas Vega", "en_curso", "alta", "Pablo", 2],
  ["Solicitud de acceso para un nuevo usuario", "Clínica Dental Sur", "resuelta", "baja", "Marta", 6],
  ["El portal no carga en el móvil del almacén", "Ferretería Alameda", "en_espera", "critica", "Iván", 1],
  ["Cambio de dirección de facturación", "Panadería Los Olmos", "resuelta", "baja", "Lucía", 9],
  ["Stock desincronizado entre tienda y ERP", "Distribuciones Norte", "abierta", "critica", "Pablo", 0],
  ["Consulta sobre el plan de mantenimiento", "Talleres Ribera", "en_espera", "baja", "Sin asignar", 4],
  ["Albarán sin número de lote", "Reformas Vega", "abierta", "media", "Marta", 3],
  ["Duplicados en el listado de clientes", "Distribuciones Norte", "en_curso", "media", "Iván", 2],
  ["Lentitud al abrir pedidos con muchas líneas", "Clínica Dental Sur", "abierta", "alta", "Lucía", 1],
  ["Traducción incorrecta en el PDF del presupuesto", "Panadería Los Olmos", "resuelta", "baja", "Pablo", 12],
  ["El descuento por volumen no se aplica", "Ferretería Alameda", "en_curso", "alta", "Marta", 0],
  ["Alta de un nuevo almacén", "Distribuciones Norte", "en_espera", "media", "Sin asignar", 7],
  ["Notificaciones repetidas en el móvil", "Talleres Ribera", "abierta", "baja", "Iván", 5],
  ["Revisión de permisos del equipo comercial", "Reformas Vega", "resuelta", "media", "Lucía", 15],
  ["Fallo en la sincronización nocturna", "Clínica Dental Sur", "en_curso", "critica", "Pablo", 0],
  ["Importar tarifas de proveedor desde Excel", "Panadería Los Olmos", "abierta", "media", "Sin asignar", 2],
];

export const SAMPLE_TICKETS: Ticket[] = ROWS.map(([subject, customer, status, priority, assignee, updatedDaysAgo], i) => ({
  id: `INC-${2040 + i}`,
  subject,
  customer,
  status,
  priority,
  assignee,
  updatedDaysAgo,
}));

export type Scenario = "normal" | "vacio" | "error";

/** Simula la llamada a una API con latencia. El escenario permite probar los estados vacío y de error. */
export function fetchTickets(scenario: Scenario, delayMs = 500): Promise<Ticket[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (scenario === "error") reject(new Error("El servidor de incidencias respondió 503 (simulado)."));
      else resolve(scenario === "vacio" ? [] : structuredClone(SAMPLE_TICKETS));
    }, delayMs);
  });
}
