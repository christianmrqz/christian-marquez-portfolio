"""Extractor por reglas: convierte el texto de una solicitud en datos estructurados sin IA.

Es determinista y deliberadamente limitado. En la interfaz se presenta como simulación del paso que, con un
proveedor configurado, haría un modelo de lenguaje (ver adapters/openai_extractor.py). La validación posterior
es la misma para los dos.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import date, timedelta

from .domain import Change, DateChange, Evidence, Extraction, Product, QuantityChange

ENGINE = "reglas-v1"

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7,
    "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}
WEEKDAYS = {"lunes": 0, "martes": 1, "miercoles": 2, "jueves": 3, "viernes": 4, "sabado": 5, "domingo": 6}

ORDER_RE = re.compile(r"\bSO[\s-]?(\d{3,6})\b|\bpedido\s+(?:n[ºo°]\.?\s*)?(\d{3,6})\b", re.I)
NUMERIC_DATE_RE = re.compile(r"\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b")
TEXT_DATE_RE = re.compile(r"\b(\d{1,2})\s+de\s+(" + "|".join(MONTHS) + r")(?:\s+(?:de\s+)?(\d{4}))?\b")
RELATIVE_DATE_RE = re.compile(r"\bpasado\s+manana\b|\bmanana\b|\b(?:el\s+)?(?:proximo\s+)?(" + "|".join(WEEKDAYS) + r")\b")
PREVIOUS_RE = re.compile(r"\ben\s+(?:lugar|vez)\s+de\s+(?:las?\s+|los\s+)?(\d{1,5})\b")
NUMBER_RE = re.compile(r"\b(\d{1,5})\b")
QUANTITY_INTENT_RE = re.compile(r"\bcantidad(?:es)?\b|\bunidades\b|\bcajas\b")
DATE_INTENT_RE = re.compile(r"\bfecha\b|\badelant\w*|\bretras\w*|\baplaz\w*|\bantes\b|\bentrega\b")
CLAUSE_SPLIT_RE = re.compile(r"[.;:\n!?]+|,|\s+y\b")


def normalize(text: str) -> str:
    """Minúsculas y sin tildes. Conserva la longitud para poder recuperar fragmentos del original."""
    decomposed = unicodedata.normalize("NFD", text)
    stripped = "".join(c for c in decomposed if unicodedata.category(c) != "Mn")
    return stripped.lower()


@dataclass
class Context:
    today: date
    catalog: list[Product]
    customers: list[str]


def _resolve_year(day: int, month: int, year: int | None, today: date) -> date | None:
    try:
        if year is not None:
            return date(year + 2000 if year < 100 else year, month, day)
        candidate = date(today.year, month, day)
        return candidate if candidate >= today else date(today.year + 1, month, day)
    except ValueError:
        return None


def _find_date(text: str, today: date) -> tuple[DateChange, tuple[int, int]] | None:
    """Primera fecha del texto (ya normalizado). Devuelve el cambio y la posición del fragmento."""
    if m := TEXT_DATE_RE.search(text):
        found = _resolve_year(int(m[1]), MONTHS[m[2]], int(m[3]) if m[3] else None, today)
        return DateChange(found.isoformat() if found else None, m[0]), m.span()
    if m := NUMERIC_DATE_RE.search(text):
        found = _resolve_year(int(m[1]), int(m[2]), int(m[3]) if m[3] else None, today)
        return DateChange(found.isoformat() if found else None, m[0]), m.span()
    if m := RELATIVE_DATE_RE.search(text):
        if m[0].startswith("pasado"):
            found = today + timedelta(days=2)
        elif m[0] == "manana":
            found = today + timedelta(days=1)
        else:
            delta = (WEEKDAYS[m[1]] - today.weekday()) % 7 or 7
            found = today + timedelta(days=delta)
        return DateChange(found.isoformat(), m[0]), m.span()
    return None


def _blank(text: str, span: tuple[int, int]) -> str:
    return text[: span[0]] + " " * (span[1] - span[0]) + text[span[1] :]


def extract(raw_text: str, ctx: Context) -> Extraction:
    original = unicodedata.normalize("NFC", raw_text.strip())
    text = normalize(original)
    evidence: list[Evidence] = []
    notes: list[str] = []
    changes: list[Change] = []

    def quote(span: tuple[int, int]) -> str:
        return original[span[0] : span[1]].strip()

    # 1. Referencia del pedido
    order_ref = None
    if m := ORDER_RE.search(text):
        order_ref = f"SO-{m[1] or m[2]}"
        evidence.append(Evidence("order_ref", quote(m.span())))
        text = _blank(text, m.span())

    # 2. Cliente (solo nombres conocidos: el extractor no inventa clientes)
    customer = None
    for name in ctx.customers:
        index = text.find(normalize(name))
        if index >= 0:
            customer = name
            evidence.append(Evidence("customer", quote((index, index + len(name)))))
            break

    # 3. Fecha de entrega
    if found := _find_date(text, ctx.today):
        change, span = found
        changes.append(change)
        evidence.append(Evidence("delivery_date", quote(span)))
        if change.date is None:
            notes.append(f"«{quote(span)}» no es una fecha válida.")
        text = _blank(text, span)

    # 4. Cantidades por producto, cláusula a cláusula
    aliases = sorted(((normalize(a), p) for p in ctx.catalog for a in p.aliases), key=lambda x: -len(x[0]))
    position = 0
    for clause in CLAUSE_SPLIT_RE.split(text):
        start = text.find(clause, position)
        position = start + len(clause)
        for alias, product in aliases:
            index = clause.find(alias)
            if index < 0:
                continue
            rest = clause[:index] + " " * len(alias) + clause[index + len(alias) :]
            previous = None
            if p := PREVIOUS_RE.search(rest):
                previous = int(p[1])
                rest = _blank(rest, p.span())
            numbers = [int(n) for n in NUMBER_RE.findall(rest)]
            if len(numbers) > 1:
                notes.append(f"Varias cifras junto a «{product.name}»; se toma la primera.")
            changes.append(QuantityChange(alias, product.sku, numbers[0] if numbers else None, previous))
            evidence.append(Evidence(f"quantity:{product.sku}", quote((start, start + len(clause)))))
            break

    # 5. Intenciones sin datos: se registran para que la validación explique qué falta
    if not any(isinstance(c, QuantityChange) for c in changes) and QUANTITY_INTENT_RE.search(text):
        changes.append(QuantityChange("", None, None))
        notes.append("Se pide cambiar una cantidad, pero no se identifica el producto.")
    if not any(isinstance(c, DateChange) for c in changes) and (m := DATE_INTENT_RE.search(text)):
        changes.append(DateChange(None, quote(m.span())))
        notes.append("Se menciona la entrega o la fecha, pero sin indicar un día.")

    return Extraction(ENGINE, order_ref, customer, changes, evidence, notes)
