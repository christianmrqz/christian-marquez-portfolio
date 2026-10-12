/** Contrato JSON del servicio Python (erp_service/web.py). Mantener sincronizado con erp_service/domain.py. */

export type OrderState = "draft" | "sale" | "done" | "cancel";

export type OrderLine = { line_id: number; sku: string; name: string; quantity: number };
export type Order = { ref: string; customer: string; state: OrderState; commitment_date: string; lines: OrderLine[]; version: string };
export type Product = { sku: string; name: string; aliases: string[] };

export type QuantityChange = { kind: "quantity"; product_query: string; sku: string | null; quantity: number | null; stated_previous: number | null };
export type DateChange = { kind: "delivery_date"; date: string | null; raw: string };

export type Extraction = {
  engine: string;
  order_ref: string | null;
  customer: string | null;
  changes: (QuantityChange | DateChange)[];
  evidence: { field: string; text: string }[];
  notes: string[];
};

export type Issue = { code: string; field: string; message: string; severity: "error" | "warning" };
export type Check = { rule: string; passed: boolean };
export type FieldChange = { field: string; label: string; before: string | number; after: string | number; line_id: number | null };
export type Proposal = { model: string; order_ref: string; base_version: string; changes: FieldChange[] };
export type Engines = { extractor: { name: string; simulated: boolean }; gateway: { name: string; simulated: boolean } };

export type ProcessResult = {
  extraction: Extraction;
  order: Order | null;
  issues: Issue[];
  checks: Check[];
  proposal: Proposal | null;
  engines: Engines;
  notices: string[];
};
export type ApplyResult = { order: Order; message: string };
export type Seed = { orders: Order[]; catalog: Product[]; customers: string[] };

export const STATE_LABELS: Record<OrderState, string> = { draft: "Presupuesto", sale: "Pedido confirmado", done: "Entregado", cancel: "Cancelado" };
