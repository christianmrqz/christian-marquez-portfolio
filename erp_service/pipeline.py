"""Orquestación: extraer → validar → proponer, y aplicar una propuesta confirmada."""

from __future__ import annotations

from datetime import date
from typing import Any

from .adapters.rules_extractor import RulesExtractor
from .domain import FieldChange, Proposal, to_json
from .extract_rules import Context
from .ports import ErpGateway, Extractor, ProviderError
from .sandbox import CATALOG, CUSTOMERS
from .validate import propose, validate


# region: pipeline
def process(text: str, today: date, extractor: Extractor, gateway: ErpGateway) -> dict[str, Any]:
    ctx = Context(today, CATALOG, CUSTOMERS)
    notices: list[str] = []
    try:
        extraction = extractor.extract(text, ctx)
    except ProviderError as error:
        # Si el proveedor de IA falla, se usan las reglas locales y se dice claramente.
        notices.append(f"{error} Se ha usado el extractor local por reglas.")
        extractor = RulesExtractor()
        extraction = extractor.extract(text, ctx)

    order = gateway.find_order(extraction.order_ref) if extraction.order_ref else None
    issues, checks = validate(extraction, order, CATALOG, today)
    proposal = propose(extraction, order, CATALOG, issues)
    return {
        "extraction": to_json(extraction),
        "order": to_json(order),
        "issues": to_json(issues),
        "checks": to_json(checks),
        "proposal": to_json(proposal),
        "engines": engines(extractor, gateway),
        "notices": notices,
    }
# endregion


def apply(proposal: Proposal, gateway: ErpGateway) -> dict[str, Any]:
    summary = "; ".join(f"{c.label}: {_display(c.before)} → {_display(c.after)}" for c in proposal.changes)
    message = f"Actualizado desde una solicitud de cliente. {summary}."
    order = gateway.apply(proposal, message)
    return {"order": to_json(order), "message": message, "engines": {"gateway": {"name": gateway.name, "simulated": gateway.simulated}}}


def _display(value: Any) -> str:
    """Fechas ISO en formato español para el historial del registro."""
    try:
        return date.fromisoformat(str(value)).strftime("%d/%m/%Y") if isinstance(value, str) else str(value)
    except ValueError:
        return str(value)


def engines(extractor: Extractor, gateway: ErpGateway) -> dict[str, Any]:
    return {
        "extractor": {"name": extractor.name, "simulated": extractor.simulated},
        "gateway": {"name": gateway.name, "simulated": gateway.simulated},
    }


def proposal_from_dict(data: dict[str, Any]) -> Proposal:
    return Proposal(
        model=str(data["model"]),
        order_ref=str(data["order_ref"]),
        base_version=str(data["base_version"]),
        changes=[FieldChange(**c) for c in data["changes"]],
    )
