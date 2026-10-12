"""API HTTP del servicio. El mismo handler sirve en local (server.py) y en Vercel (api/erp.py).

GET  /api/erp?op=health                 Adaptadores activos
GET  /api/erp?op=seed&today=AAAA-MM-DD  Pedidos ficticios iniciales del sandbox
POST /api/erp?op=process                {text, today?, orders?} → extracción, validación y propuesta
POST /api/erp?op=apply                  {proposal, orders?}     → pedido actualizado
Errores: {"error": {"code", "message"}}
"""

from __future__ import annotations

import json
import os
from datetime import date
from http.server import BaseHTTPRequestHandler
from typing import Any
from urllib.parse import parse_qs, urlparse

from . import pipeline
from .config import ConfigError, build_extractor, build_gateway
from .domain import Order
from .ports import ConflictError, ProviderError
from .sandbox import seed_orders, seed_payload

MAX_BODY = 64 * 1024
MAX_TEXT = 1500
MAX_ORDERS = 10


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def _today(value: Any) -> date:
    if value is None:
        return date.today()
    try:
        return date.fromisoformat(str(value))
    except ValueError as error:
        raise ApiError(400, "invalid_date", "today debe tener el formato AAAA-MM-DD.") from error


def _orders(value: Any, today: date) -> list[Order]:
    if value is None:
        return seed_orders(today)
    if not isinstance(value, list) or len(value) > MAX_ORDERS:
        raise ApiError(400, "invalid_orders", f"orders debe ser una lista de como máximo {MAX_ORDERS} pedidos.")
    try:
        return [Order.from_dict(o) for o in value]
    except (KeyError, TypeError, ValueError) as error:
        raise ApiError(400, "invalid_orders", "Algún pedido del sandbox no tiene el formato esperado.") from error


def handle(method: str, query: dict[str, str], body: dict[str, Any]) -> dict[str, Any]:
    op = query.get("op")
    if method == "GET" and op == "health":
        return pipeline.engines(build_extractor(), build_gateway([]))
    if method == "GET" and op == "seed":
        return seed_payload(_today(query.get("today")))
    if method == "POST" and op == "process":
        text = body.get("text")
        if not isinstance(text, str) or not text.strip():
            raise ApiError(422, "empty_text", "Escribe o selecciona una solicitud.")
        if len(text) > MAX_TEXT:
            raise ApiError(422, "text_too_long", f"La solicitud no puede superar {MAX_TEXT} caracteres.")
        today = _today(body.get("today"))
        return pipeline.process(text, today, build_extractor(), build_gateway(_orders(body.get("orders"), today)))
    if method == "POST" and op == "apply":
        try:
            proposal = pipeline.proposal_from_dict(body["proposal"])
        except (KeyError, TypeError) as error:
            raise ApiError(400, "invalid_proposal", "La propuesta no tiene el formato esperado.") from error
        return pipeline.apply(proposal, build_gateway(_orders(body.get("orders"), date.today())))
    raise ApiError(404, "not_found", "Operación no encontrada.")


class ErpHandler(BaseHTTPRequestHandler):
    server_version = "erp-demo"

    def _send(self, status: int, payload: dict[str, Any]) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _dispatch(self, method: str) -> None:
        url = urlparse(self.path)
        query = {k: v[0] for k, v in parse_qs(url.query).items()}
        try:
            body: dict[str, Any] = {}
            if method == "POST":
                length = int(self.headers.get("Content-Length") or 0)
                if length > MAX_BODY:
                    raise ApiError(413, "too_large", "Petición demasiado grande.")
                try:
                    body = json.loads(self.rfile.read(length) or b"{}")
                except json.JSONDecodeError as error:
                    raise ApiError(400, "invalid_json", "El cuerpo no es JSON válido.") from error
                if not isinstance(body, dict):
                    raise ApiError(400, "invalid_json", "El cuerpo debe ser un objeto JSON.")
            self._send(200, handle(method, query, body))
        except ApiError as error:
            self._send(error.status, {"error": {"code": error.code, "message": error.message}})
        except ConflictError as error:
            self._send(409, {"error": {"code": "conflict", "message": str(error)}})
        except ProviderError as error:
            self._send(502, {"error": {"code": "provider_error", "message": str(error)}})
        except ConfigError as error:
            self._send(500, {"error": {"code": "misconfigured", "message": str(error)}})

    def do_GET(self) -> None:  # noqa: N802 (nombre impuesto por BaseHTTPRequestHandler)
        self._dispatch("GET")

    def do_POST(self) -> None:  # noqa: N802
        self._dispatch("POST")

    def log_message(self, format: str, *args: Any) -> None:
        if os.environ.get("ERP_LOG") == "1":
            super().log_message(format, *args)
