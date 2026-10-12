"""Tipos del dominio de la demo: pedidos de venta ficticios y solicitudes de cambio.

Los nombres de campo siguen a Odoo (sale.order, commitment_date, product_uom_qty) para que el adaptador
real sea una traducción directa, pero aquí no hay ninguna dependencia de Odoo.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

OrderState = Literal["draft", "sale", "done", "cancel"]
EDITABLE_STATES: tuple[OrderState, ...] = ("draft", "sale")
STATE_LABELS = {"draft": "Presupuesto", "sale": "Pedido confirmado", "done": "Entregado", "cancel": "Cancelado"}


@dataclass
class Product:
    sku: str
    name: str
    aliases: list[str]


@dataclass
class OrderLine:
    line_id: int
    sku: str
    name: str
    quantity: int


@dataclass
class Order:
    ref: str
    customer: str
    state: OrderState
    commitment_date: str  # ISO yyyy-mm-dd
    lines: list[OrderLine]
    version: str = "1"  # token opaco: contador en el sandbox, write_date en Odoo. Detecta cambios concurrentes.

    def line_for(self, sku: str) -> OrderLine | None:
        return next((line for line in self.lines if line.sku == sku), None)

    @staticmethod
    def from_dict(data: dict[str, Any]) -> "Order":
        return Order(
            ref=str(data["ref"]),
            customer=str(data["customer"]),
            state=data["state"],
            commitment_date=str(data["commitment_date"]),
            lines=[OrderLine(**line) for line in data["lines"]],
            version=str(data.get("version", "1")),
        )


@dataclass
class Evidence:
    """Fragmento literal del texto que justifica un dato extraído."""

    field: str
    text: str


@dataclass
class QuantityChange:
    product_query: str
    sku: str | None
    quantity: int | None
    stated_previous: int | None = None  # «en lugar de 25»: lo que el cliente cree que hay
    kind: Literal["quantity"] = "quantity"


@dataclass
class DateChange:
    date: str | None  # ISO; None si se pidió cambiar la fecha sin indicar cuál
    raw: str
    kind: Literal["delivery_date"] = "delivery_date"


Change = QuantityChange | DateChange


@dataclass
class Extraction:
    """Salida del extractor: datos estructurados, aún sin validar."""

    engine: str
    order_ref: str | None
    customer: str | None
    changes: list[Change]
    evidence: list[Evidence] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)


@dataclass
class Issue:
    code: str
    field: str
    message: str
    severity: Literal["error", "warning"] = "error"


@dataclass
class Check:
    """Una regla evaluada, para mostrar también lo que sí se ha comprobado."""

    rule: str
    passed: bool


@dataclass
class FieldChange:
    field: str  # ruta legible del campo en el ERP
    label: str
    before: Any
    after: Any
    line_id: int | None = None


@dataclass
class Proposal:
    model: str
    order_ref: str
    base_version: str
    changes: list[FieldChange]


def to_json(value: Any) -> Any:
    """Serializa dataclasses (y listas de ellas) a estructuras JSON."""
    if isinstance(value, list):
        return [to_json(v) for v in value]
    if hasattr(value, "__dataclass_fields__"):
        return asdict(value)
    return value
