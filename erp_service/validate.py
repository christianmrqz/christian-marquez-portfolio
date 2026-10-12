"""Reglas de negocio. Se aplican igual a la salida de las reglas locales y a la de un modelo de lenguaje."""

from __future__ import annotations

from datetime import date

from .domain import EDITABLE_STATES, STATE_LABELS, Check, DateChange, Extraction, FieldChange, Issue, Order, Product, Proposal, QuantityChange

MAX_QUANTITY = 10_000


def _fmt_date(iso: str) -> str:
    d = date.fromisoformat(iso)
    return d.strftime("%d/%m/%Y")


def validate(extraction: Extraction, order: Order | None, catalog: list[Product], today: date) -> tuple[list[Issue], list[Check]]:
    issues: list[Issue] = []
    checks: list[Check] = []

    def rule(name: str, passed: bool, issue: Issue | None = None) -> bool:
        checks.append(Check(name, passed))
        if not passed and issue:
            issues.append(issue)
        return passed

    # region: reglas
    has_ref = rule("Indica el número de pedido", extraction.order_ref is not None,
                   Issue("missing_order_ref", "order_ref", "Falta el número de pedido (por ejemplo, SO-1042)."))
    if has_ref:
        exists = rule("El pedido existe en el ERP", order is not None,
                      Issue("order_not_found", "order_ref", f"No hay ningún pedido {extraction.order_ref}."))
        if exists and order:
            if extraction.customer:
                rule("El cliente coincide con el del pedido", extraction.customer == order.customer,
                     Issue("customer_mismatch", "customer", f"El pedido {order.ref} es de {order.customer}, no de {extraction.customer}."))
            rule("El pedido admite cambios", order.state in EDITABLE_STATES,
                 Issue("order_locked", "state", f"El pedido {order.ref} está en estado «{STATE_LABELS[order.state]}» y no admite cambios."))
    # endregion

    rule("Pide al menos un cambio", bool(extraction.changes),
         Issue("no_changes", "changes", "No se reconoce ningún cambio: cantidad de un producto o fecha de entrega."))

    names = {p.sku: p.name for p in catalog}
    for change in extraction.changes:
        if isinstance(change, QuantityChange):
            label = names.get(change.sku or "", "el producto")
            if not rule("Identifica el producto", change.sku is not None,
                        Issue("unknown_product", "product", "No se identifica el producto cuya cantidad hay que cambiar.")):
                continue
            line = order.line_for(change.sku) if order else None
            if order and not rule(f"{label} está en el pedido", line is not None,
                                  Issue("product_not_in_order", "product", f"{label} no forma parte del pedido {order.ref}.")):
                continue
            if not rule(f"Indica la cantidad de {label}", change.quantity is not None,
                        Issue("missing_quantity", "quantity", f"Falta la nueva cantidad de {label}.")):
                continue
            assert change.quantity is not None
            rule(f"Cantidad entre 1 y {MAX_QUANTITY}", 1 <= change.quantity <= MAX_QUANTITY,
                 Issue("invalid_quantity", "quantity", f"La cantidad {change.quantity} está fuera del rango permitido."))
            if line and change.quantity == line.quantity:
                issues.append(Issue("no_effect", "quantity", f"{label} ya tiene {line.quantity} unidades.", "warning"))
            if line and change.stated_previous is not None and change.stated_previous != line.quantity:
                issues.append(Issue("stale_reference", "quantity",
                                    f"El cliente indica que había {change.stated_previous} y el ERP tiene {line.quantity}. Conviene confirmarlo.", "warning"))
        elif isinstance(change, DateChange):
            if not rule("Indica una fecha de entrega válida", change.date is not None,
                        Issue("missing_date", "delivery_date", f"«{change.raw}» no permite fijar una fecha de entrega concreta.")):
                continue
            assert change.date is not None
            rule("La fecha de entrega es posterior a hoy", date.fromisoformat(change.date) > today,
                 Issue("past_date", "delivery_date", f"La fecha {_fmt_date(change.date)} no es posterior a hoy."))
            if order and change.date == order.commitment_date:
                issues.append(Issue("no_effect", "delivery_date", "La fecha pedida ya es la fecha de entrega del pedido.", "warning"))

    return issues, checks


# region: propuesta
def propose(extraction: Extraction, order: Order | None, catalog: list[Product], issues: list[Issue]) -> Proposal | None:
    """Solo hay propuesta si no hay errores. Las advertencias se muestran, pero no bloquean."""
    if order is None or any(i.severity == "error" for i in issues):
        return None
    names = {p.sku: p.name for p in catalog}
    changes: list[FieldChange] = []
    for change in extraction.changes:
        if isinstance(change, QuantityChange) and change.sku and change.quantity is not None:
            line = order.line_for(change.sku)
            if line and line.quantity != change.quantity:
                short = names.get(change.sku, change.sku).split(" (")[0]
                changes.append(FieldChange(f"order_line[{line.line_id}].product_uom_qty", f"Cantidad · {short}", line.quantity, change.quantity, line.line_id))
        elif isinstance(change, DateChange) and change.date and change.date != order.commitment_date:
            changes.append(FieldChange("commitment_date", "Fecha de entrega", order.commitment_date, change.date))
    if not changes:
        return None
    return Proposal("sale.order", order.ref, order.version, changes)
# endregion
