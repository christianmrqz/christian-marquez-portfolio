"""Contratos entre el procesamiento y el exterior. El pipeline solo conoce estas interfaces."""

from __future__ import annotations

from typing import Protocol

from .domain import Extraction, Order, Proposal
from .extract_rules import Context


# region: puertos
class Extractor(Protocol):
    name: str
    simulated: bool

    def extract(self, text: str, ctx: Context) -> Extraction: ...


class ErpGateway(Protocol):
    name: str
    simulated: bool

    def find_order(self, ref: str) -> Order | None: ...

    def apply(self, proposal: Proposal, message: str) -> Order: ...
# endregion


class ConflictError(Exception):
    """El registro cambió desde que se generó la propuesta."""


class ProviderError(Exception):
    """Fallo de un proveedor externo (OpenAI, Odoo). El mensaje es apto para mostrarse."""
