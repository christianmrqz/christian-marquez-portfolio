"""Adaptador para Odoo mediante JSON-RPC (/jsonrpc, servicio «object», método execute_kw).

Estado: implementado y probado con un transporte falso (tests/test_adapters.py). No se ha probado contra una
instancia real. Odoo 19 marca XML-RPC/JSON-RPC como obsoletos en favor de la API JSON-2; si la instancia es 19+
conviene revisar este adaptador.

Se activa con ERP_GATEWAY=odoo. Por seguridad, solo escribe si ODOO_ALLOW_WRITE=true: la demo pública no debe
poder modificar un ERP real.
"""

from __future__ import annotations

import itertools
from typing import Any

from ..domain import Order, OrderLine, OrderState, Proposal
from ..ports import ConflictError, ProviderError
from .transport import PostJson, post_json

# En Odoo 17+ «sent» es un presupuesto enviado y los pedidos bloqueados se marcan con «locked».
STATE_MAP: dict[str, OrderState] = {"draft": "draft", "sent": "draft", "sale": "sale", "done": "done", "cancel": "cancel"}


class OdooGateway:
    name = "odoo"
    simulated = False

    def __init__(self, url: str, db: str, login: str, api_key: str, allow_write: bool = False, transport: PostJson = post_json):
        self._endpoint = url.rstrip("/") + "/jsonrpc"
        self._db, self._login, self._key = db, login, api_key
        self._allow_write = allow_write
        self._post = transport
        self._uid: int | None = None
        self._ids = itertools.count(1)

    def _call(self, service: str, method: str, *args: Any) -> Any:
        payload = {"jsonrpc": "2.0", "method": "call", "params": {"service": service, "method": method, "args": list(args)}, "id": next(self._ids)}
        response = self._post(self._endpoint, {}, payload)
        if response.get("error"):
            message = response["error"].get("data", {}).get("message") or response["error"].get("message", "error")
            raise ProviderError(f"Odoo: {message}")
        return response.get("result")

    def _execute(self, model: str, method: str, args: list[Any], kwargs: dict[str, Any] | None = None) -> Any:
        if self._uid is None:
            uid = self._call("common", "authenticate", self._db, self._login, self._key, {})
            if not uid:
                raise ProviderError("Odoo: credenciales no válidas.")
            self._uid = uid
        return self._call("object", "execute_kw", self._db, self._uid, self._key, model, method, args, kwargs or {})

    def find_order(self, ref: str) -> Order | None:
        found = self._execute("sale.order", "search_read", [[["name", "=", ref]]],
                              {"fields": ["name", "partner_id", "state", "locked", "commitment_date", "write_date"], "limit": 1})
        if not found:
            return None
        record = found[0]
        lines = self._execute("sale.order.line", "search_read", [[["order_id", "=", record["id"]], ["display_type", "=", False]]],
                              {"fields": ["product_id", "product_uom_qty", "name"]})
        product_ids = [line["product_id"][0] for line in lines if line.get("product_id")]
        codes = {p["id"]: p.get("default_code") or "" for p in self._execute("product.product", "read", [product_ids], {"fields": ["default_code"]})} if product_ids else {}
        state = STATE_MAP.get(record["state"], "cancel")
        if record.get("locked"):
            state = "done"
        return Order(
            ref=record["name"],
            customer=record["partner_id"][1] if record.get("partner_id") else "",
            state=state,
            commitment_date=(record.get("commitment_date") or "")[:10],
            lines=[OrderLine(line["id"], codes.get(line["product_id"][0], ""), line["name"], int(line["product_uom_qty"])) for line in lines if line.get("product_id")],
            version=record["write_date"],
        )

    def apply(self, proposal: Proposal, message: str) -> Order:
        if not self._allow_write:
            raise ProviderError("Escritura en Odoo desactivada (ODOO_ALLOW_WRITE no es true).")
        current = self.find_order(proposal.order_ref)
        if current is None or current.version != proposal.base_version:
            raise ConflictError("El pedido ha cambiado en Odoo desde que se generó la propuesta.")
        order_id = self._execute("sale.order", "search", [[["name", "=", proposal.order_ref]]], {"limit": 1})[0]
        for change in proposal.changes:
            if change.field == "commitment_date":
                # commitment_date es Datetime en Odoo (UTC). Se fija a mediodía para no cambiar de día con la zona horaria.
                self._execute("sale.order", "write", [[order_id], {"commitment_date": f"{change.after} 12:00:00"}])
            elif change.line_id is not None:
                self._execute("sale.order.line", "write", [[change.line_id], {"product_uom_qty": change.after}])
        self._execute("sale.order", "message_post", [[order_id]], {"body": message})
        updated = self.find_order(proposal.order_ref)
        assert updated is not None
        return updated
