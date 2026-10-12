/** Experiencia. Redactada a partir de los dos CV; no añadir logros ni métricas que no estén en ellos. */

export type Experience = {
  id: string;
  role: string;
  company: string;
  context: string;
  period: string;
  kind: "profesional" | "complementaria";
  points: string[];
  stack: string[];
  caseHref?: string;
};

export const experience: Experience[] = [
  {
    id: "freelance",
    role: "Desarrollador full stack freelance",
    company: "Clientes propios",
    context: "Remoto",
    period: "jul 2023 – actualidad",
    kind: "profesional",
    points: [
      "Módulos de Odoo que envían datos a la API de OpenAI, procesan las respuestas y actualizan campos y registros del ERP según los requisitos de cada cliente; por ejemplo, PDFs que envían los clientes y se incorporan directamente al ERP.",
      "Módulos a medida para los procesos de cada empresa, conectados con Make y flujos de trabajo automatizados. Tres años con Odoo, hasta su versión más reciente.",
      "Aplicaciones web con Vue.js, JavaScript y TypeScript: interfaces responsive e integración de APIs REST.",
      "Análisis de requisitos con clientes y traducción de sus procesos de negocio en funcionalidades e integraciones.",
    ],
    stack: ["Python", "Odoo", "API de OpenAI", "Make", "Vue.js", "TypeScript", "APIs REST"],
    caseHref: "/proyectos/odoo-ia",
  },
  {
    id: "telefonica",
    role: "Frontend developer",
    company: "Telefónica",
    context: "Programa Talentum · Madrid",
    period: "sep 2022 – sep 2023",
    kind: "profesional",
    points: [
      "Participación en la migración integral del área privada de Movistar: adaptación de funcionalidades y layouts a la tecnología y al diseño compartidos con otros proyectos.",
      "Me encargué de la sección de dispositivos del hogar: teléfonos contratados, dispositivos financiados con promociones, importe pendiente y recibos, a partir de los datos del sistema central de cada cliente.",
      "Desarrollo con React, Redux-Saga y JavaScript; integración de APIs backend y componentes reutilizables con Sass.",
      "Trabajo en equipo con Scrum durante la renovación del área privada.",
    ],
    stack: ["React", "Redux-Saga", "JavaScript", "Sass", "Scrum"],
    caseHref: "/proyectos/movistar",
  },
  {
    id: "fersoft",
    role: "Desarrollador de software",
    company: "Fersoft Informática",
    context: "Córdoba",
    period: "mar 2022 – ago 2022",
    kind: "profesional",
    points: ["Diagnóstico y resolución de incidencias del ERP de clientes, con depuración de código en sistemas legacy."],
    stack: ["ERP", "Depuración", "Sistemas legacy"],
  },
  {
    id: "tecnocasa",
    role: "Asesor comercial inmobiliario",
    company: "Tecnocasa",
    context: "Experiencia complementaria",
    period: "mar 2026 – actualidad",
    kind: "complementaria",
    points: ["Atención a clientes, análisis de necesidades y seguimiento comercial."],
    stack: [],
  },
];
