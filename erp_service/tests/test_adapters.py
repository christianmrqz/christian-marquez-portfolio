"""Adaptadores y API HTTP, sin red: OpenAI y Odoo se prueban con transportes falsos."""

import json
import unittest
from datetime import date

from erp_service import pipeline
from erp_service.adapters.odoo_gateway import OdooGateway
from erp_service.adapters.openai_extractor import OpenAIExtractor
from erp_service.adapters.sandbox_gateway import SandboxGateway
from erp_service.domain import FieldChange, Proposal, QuantityChange, to_json
from erp_service.extract_rules import Context
from erp_service.ports import ConflictError, ProviderError
from erp_service.sandbox import CATALOG, CUSTOMERS, seed_orders
from erp_service.web import ApiError, handle

TODAY = date(2026, 10, 12)
CTX = Context(TODAY, CATALOG, CUSTOMERS)
TEXT = "Pedido SO-1042: necesitamos 40 cajas de tornillo M6."


def completion(payload: dict) -> dict:
    return {"choices": [{"message": {"content": json.dumps(payload)}}]}


class FakeTransport:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, url, headers, body):
        self.calls.append((url, headers, body))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class OpenAIExtractorTest(unittest.TestCase):
    def test_request_uses_strict_json_schema_and_bearer_key(self):
        transport = FakeTransport(completion({"order_ref": "SO-1042", "customer": None, "notes": [], "changes": []}))
        OpenAIExtractor("sk-test", "modelo-x", transport).extract(TEXT, CTX)
        url, headers, body = transport.calls[0]
        self.assertTrue(url.endswith("/v1/chat/completions"))
        self.assertEqual(headers["Authorization"], "Bearer sk-test")
        self.assertEqual(body["model"], "modelo-x")
        self.assertTrue(body["response_format"]["json_schema"]["strict"])
        self.assertIn("<solicitud>", body["messages"][1]["content"])

    def test_changes_without_literal_evidence_are_discarded(self):
        transport = FakeTransport(completion({
            "order_ref": "SO-1042", "customer": "Cliente Inventado", "notes": [],
            "changes": [
                {"kind": "quantity", "product_sku": "TOR-M6-40", "quantity": 40, "stated_previous": None, "date": None, "evidence": "40 cajas de tornillo M6"},
                {"kind": "delivery_date", "product_sku": None, "quantity": None, "stated_previous": None, "date": "2026-10-20", "evidence": "entrega el día 20"},
                {"kind": "quantity", "product_sku": "NO-EXISTE", "quantity": 3, "stated_previous": None, "date": None, "evidence": "necesitamos"},
            ],
        }))
        e = OpenAIExtractor("k", "m", transport).extract(TEXT, CTX)
        self.assertEqual(e.customer, None)  # cliente desconocido: no se acepta
        self.assertEqual(e.changes, [QuantityChange("40 cajas de tornillo M6", "TOR-M6-40", 40, None), QuantityChange("necesitamos", None, 3, None)])
        self.assertTrue(any("cita no aparece" in n for n in e.notes))

    def test_provider_failure_falls_back_to_rules_and_says_so(self):
        transport = FakeTransport(ProviderError("No se pudo conectar con el proveedor."))
        result = pipeline.process(TEXT, TODAY, OpenAIExtractor("k", "m", transport), SandboxGateway(seed_orders(TODAY)))
        self.assertEqual(result["engines"]["extractor"], {"name": "reglas-v1", "simulated": True})
        self.assertIn("extractor local", result["notices"][0])
        self.assertIsNotNone(result["proposal"])

    def test_refusal_is_a_provider_error(self):
        transport = FakeTransport({"choices": [{"message": {"refusal": "no", "content": None}}]})
        with self.assertRaises(ProviderError):
            OpenAIExtractor("k", "m", transport).extract(TEXT, CTX)


def rpc(result):
    return {"jsonrpc": "2.0", "id": 1, "result": result}


ODOO_ORDER = [{"id": 7, "name": "SO-1042", "partner_id": [3, "Ferretería Alameda"], "state": "sale", "locked": False,
               "commitment_date": "2026-10-28 12:00:00", "write_date": "2026-10-12 09:00:00"}]
ODOO_LINES = [{"id": 11, "product_id": [21, "Tornillo"], "product_uom_qty": 25.0, "name": "Tornillo M6"}]
ODOO_PRODUCTS = [{"id": 21, "default_code": "TOR-M6-40"}]


class OdooGatewayTest(unittest.TestCase):
    def test_find_order_maps_odoo_records(self):
        transport = FakeTransport(rpc(5), rpc(ODOO_ORDER), rpc(ODOO_LINES), rpc(ODOO_PRODUCTS))
        order = OdooGateway("https://erp.example", "db", "user", "key", transport=transport).find_order("SO-1042")
        self.assertEqual((order.customer, order.state, order.commitment_date, order.version), ("Ferretería Alameda", "sale", "2026-10-28", "2026-10-12 09:00:00"))
        self.assertEqual((order.lines[0].sku, order.lines[0].quantity), ("TOR-M6-40", 25))
        params = transport.calls[1][2]["params"]
        self.assertEqual(params["args"][3:5], ["sale.order", "search_read"])

    def test_writes_are_disabled_unless_explicitly_allowed(self):
        proposal = Proposal("sale.order", "SO-1042", "x", [])
        with self.assertRaises(ProviderError):
            OdooGateway("https://erp.example", "db", "user", "key", transport=FakeTransport()).apply(proposal, "msg")

    def test_apply_checks_version_writes_fields_and_posts_message(self):
        transport = FakeTransport(
            rpc(5), rpc(ODOO_ORDER), rpc(ODOO_LINES), rpc(ODOO_PRODUCTS),  # find_order (versión)
            rpc([7]), rpc(True), rpc(True), rpc(99),  # search, write x2, message_post
            rpc(ODOO_ORDER), rpc(ODOO_LINES), rpc(ODOO_PRODUCTS),  # relectura
        )
        gateway = OdooGateway("https://erp.example", "db", "user", "key", allow_write=True, transport=transport)
        proposal = Proposal("sale.order", "SO-1042", "2026-10-12 09:00:00", [
            FieldChange("commitment_date", "Fecha", "2026-10-28", "2026-10-24"),
            FieldChange("order_line[11].product_uom_qty", "Cantidad", 25, 40, 11),
        ])
        gateway.apply(proposal, "Actualizado")
        methods = [(c[2]["params"]["args"][3], c[2]["params"]["args"][4]) for c in transport.calls[1:] if c[2]["params"]["method"] == "execute_kw"]
        self.assertIn(("sale.order.line", "write"), methods)
        self.assertIn(("sale.order", "message_post"), methods)
        write_date = next(c[2]["params"]["args"][5] for c in transport.calls if c[2]["params"]["args"][3:5] == ["sale.order", "write"])
        self.assertEqual(write_date, [[7], {"commitment_date": "2026-10-24 12:00:00"}])

    def test_apply_rejects_stale_version(self):
        transport = FakeTransport(rpc(5), rpc(ODOO_ORDER), rpc(ODOO_LINES), rpc(ODOO_PRODUCTS))
        gateway = OdooGateway("https://erp.example", "db", "user", "key", allow_write=True, transport=transport)
        with self.assertRaises(ConflictError):
            gateway.apply(Proposal("sale.order", "SO-1042", "otra-version", []), "msg")


class SandboxAndApiTest(unittest.TestCase):
    def test_apply_updates_order_and_bumps_version(self):
        orders = to_json(seed_orders(TODAY))
        processed = handle("POST", {"op": "process"}, {"text": TEXT, "today": "2026-10-12", "orders": orders})
        applied = handle("POST", {"op": "apply"}, {"proposal": processed["proposal"], "orders": orders})
        self.assertEqual(applied["order"]["lines"][0]["quantity"], 40)
        self.assertEqual(applied["order"]["version"], "2")
        self.assertIn("25 → 40", applied["message"])

    def test_applying_the_same_proposal_twice_is_a_conflict(self):
        orders = to_json(seed_orders(TODAY))
        proposal = handle("POST", {"op": "process"}, {"text": TEXT, "today": "2026-10-12", "orders": orders})["proposal"]
        updated = handle("POST", {"op": "apply"}, {"proposal": proposal, "orders": orders})["order"]
        new_orders = [updated if o["ref"] == updated["ref"] else o for o in orders]
        with self.assertRaises(ConflictError):
            handle("POST", {"op": "apply"}, {"proposal": proposal, "orders": new_orders})

    def test_input_errors(self):
        cases = [
            ({"op": "process"}, {"text": "  "}, "empty_text"),
            ({"op": "process"}, {"text": "x" * 1501}, "text_too_long"),
            ({"op": "process"}, {"text": "SO-1042", "today": "12/10/2026"}, "invalid_date"),
            ({"op": "process"}, {"text": "SO-1042", "orders": [{"ref": 1}]}, "invalid_orders"),
            ({"op": "apply"}, {}, "invalid_proposal"),
            ({"op": "nada"}, {}, "not_found"),
        ]
        for query, body, code in cases:
            with self.subTest(code=code), self.assertRaises(ApiError) as ctx:
                handle("POST", query, body)
            self.assertEqual(ctx.exception.code, code)

    def test_health_reports_simulation_by_default(self):
        self.assertEqual(handle("GET", {"op": "health"}, {}), {
            "extractor": {"name": "reglas-v1", "simulated": True},
            "gateway": {"name": "sandbox", "simulated": True},
        })


if __name__ == "__main__":
    unittest.main()
