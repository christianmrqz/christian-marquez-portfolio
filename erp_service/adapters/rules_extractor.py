from __future__ import annotations

from .. import extract_rules
from ..domain import Extraction
from ..extract_rules import Context


class RulesExtractor:
    """Extracción local por reglas. Determinista, sin red ni claves: es la simulación por defecto."""

    name = extract_rules.ENGINE
    simulated = True

    def extract(self, text: str, ctx: Context) -> Extraction:
        return extract_rules.extract(text, ctx)
