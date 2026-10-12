"""Reglas de la demo: extracción local, validación y propuesta. python -m unittest discover -s erp_service/tests -t ."""

import unittest
from datetime import date

from erp_service.domain import DateChange, QuantityChange
from erp_service.extract_rules import Context, extract
from erp_service.sandbox import CATALOG, CUSTOMERS, seed_orders
from erp_service.validate import propose, validate

TODAY = date(2026, 10, 12)  # lunes
CTX = Context(TODAY, CATALOG, CUSTOMERS)
ORDERS = {o.ref: o for o in seed_orders(TODAY)}

VALID = "Hola, somos Ferretería Alameda. Para el pedido SO-1042 necesitamos 40 cajas de tornillo M6 en lugar de 25 y, si es posible, recibirlo el 24 de octubre. Gracias."
INSUFFICIENT = "Buenas, ¿podéis cambiar la cantidad del pedido? Lo necesitamos antes. Gracias."
LOCKED = "Pedido SO-1043 de Talleres Ribera: dejad en 12 las cajas de broca de 10 mm."


def run(text: str):
    extraction = extract(text, CTX)
    order = ORDERS.get(extraction.order_ref or "")
    issues, checks = validate(extraction, order, CATALOG, TODAY)
    return extraction, issues, propose(extraction, order, CATALOG, issues)


def codes(issues, severity="error"):
    return sorted(i.code for i in issues if i.severity == severity)


class ExtractionTest(unittest.TestCase):
    def test_valid_request_is_structured(self):
        e = extract(VALID, CTX)
        self.assertEqual(e.order_ref, "SO-1042")
        self.assertEqual(e.customer, "Ferretería Alameda")
        quantity = next(c for c in e.changes if isinstance(c, QuantityChange))
        self.assertEqual((quantity.sku, quantity.quantity, quantity.stated_previous), ("TOR-M6-40", 40, 25))
        self.assertIn(DateChange("2026-10-24", "24 de octubre"), e.changes)

    def test_numbers_inside_product_names_are_not_quantities(self):
        e = extract("SO-1044: 7 cajas de tacos de 8 mm", CTX)
        quantity = next(c for c in e.changes if isinstance(c, QuantityChange))
        self.assertEqual((quantity.sku, quantity.quantity), ("TAC-08", 7))

    def test_date_formats(self):
        cases = {
            "SO-1042 entrega el 3/11": "2026-11-03",
            "SO-1042 entrega el 3/11/2027": "2027-11-03",
            "SO-1042 entrega el 5 de enero": "2027-01-05",  # sin año y ya pasado → año siguiente
            "SO-1042 lo queremos mañana": "2026-10-13",
            "SO-1042 lo queremos pasado mañana": "2026-10-14",
            "SO-1042 lo queremos el viernes": "2026-10-16",
            "SO-1042 lo queremos el próximo lunes": "2026-10-19",
        }
        for text, expected in cases.items():
            with self.subTest(text=text):
                change = next(c for c in extract(text, CTX).changes if isinstance(c, DateChange))
                self.assertEqual(change.date, expected)

    def test_impossible_date_is_reported_not_guessed(self):
        e = extract("SO-1042 entrega el 31/02", CTX)
        self.assertEqual(e.changes, [DateChange(None, "31/02")])

    def test_order_reference_variants(self):
        for text in ["SO-1042", "so 1042", "SO1042", "pedido nº 1042", "pedido 1042"]:
            with self.subTest(text=text):
                self.assertEqual(extract(text, CTX).order_ref, "SO-1042")

    def test_unknown_customer_is_not_invented(self):
        self.assertIsNone(extract("Somos Hierros Pérez, pedido SO-1042, 30 cajas de tornillo M6", CTX).customer)


class ValidationTest(unittest.TestCase):
    def test_valid_request_produces_proposal(self):
        _, issues, proposal = run(VALID)
        self.assertEqual(codes(issues), [])
        self.assertIsNotNone(proposal)
        fields = {c.field: (c.before, c.after) for c in proposal.changes}
        self.assertEqual(fields["order_line[1].product_uom_qty"], (25, 40))
        self.assertEqual(fields["commitment_date"], ("2026-10-28", "2026-10-24"))
        self.assertEqual(proposal.base_version, "1")

    def test_insufficient_request_explains_what_is_missing(self):
        _, issues, proposal = run(INSUFFICIENT)
        self.assertEqual(codes(issues), ["missing_date", "missing_order_ref", "unknown_product"])
        self.assertIsNone(proposal)

    def test_delivered_order_is_locked(self):
        _, issues, proposal = run(LOCKED)
        self.assertEqual(codes(issues), ["order_locked"])
        self.assertIsNone(proposal)

    def test_business_rules(self):
        cases = {
            "SO-9999, 10 cajas de tornillo M6": ["order_not_found"],
            "SO-1042, 10 cajas de broca de 10 mm": ["product_not_in_order"],
            "SO-1042, 0 cajas de tornillo M6": ["invalid_quantity"],
            "SO-1042, tornillo M6 por favor": ["missing_quantity"],
            "Reformas Vega: SO-1042, 30 cajas de tornillo M6": ["customer_mismatch"],
            "SO-1042, entrega el 1 de octubre de 2026": ["past_date"],
            "SO-1042, gracias": ["no_changes"],
        }
        for text, expected in cases.items():
            with self.subTest(text=text):
                self.assertEqual(codes(run(text)[1]), expected)

    def test_warnings_do_not_block(self):
        _, issues, proposal = run("SO-1042: 40 cajas de tornillo M6 en lugar de 20")
        self.assertEqual(codes(issues, "warning"), ["stale_reference"])
        self.assertIsNotNone(proposal)

    def test_no_proposal_when_nothing_changes(self):
        _, issues, proposal = run("SO-1042: 25 cajas de tornillo M6")
        self.assertEqual(codes(issues, "warning"), ["no_effect"])
        self.assertIsNone(proposal)


if __name__ == "__main__":
    unittest.main()
