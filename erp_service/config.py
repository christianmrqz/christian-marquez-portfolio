"""Selección de adaptadores a partir de variables de entorno. Sin variables: todo local y simulado."""

from __future__ import annotations

import os
from collections.abc import Mapping

from .adapters.odoo_gateway import OdooGateway
from .adapters.openai_extractor import OpenAIExtractor
from .adapters.rules_extractor import RulesExtractor
from .adapters.sandbox_gateway import SandboxGateway
from .domain import Order
from .ports import ErpGateway, Extractor


class ConfigError(Exception):
    pass


def build_extractor(env: Mapping[str, str] = os.environ) -> Extractor:
    kind = env.get("ERP_EXTRACTOR", "rules")
    if kind == "rules":
        return RulesExtractor()
    if kind == "openai":
        key, model = env.get("OPENAI_API_KEY"), env.get("OPENAI_MODEL")
        if not key or not model:
            raise ConfigError("ERP_EXTRACTOR=openai requiere OPENAI_API_KEY y OPENAI_MODEL.")
        return OpenAIExtractor(key, model)
    raise ConfigError(f"ERP_EXTRACTOR desconocido: {kind}")


def build_gateway(sandbox_orders: list[Order], env: Mapping[str, str] = os.environ) -> ErpGateway:
    kind = env.get("ERP_GATEWAY", "sandbox")
    if kind == "sandbox":
        return SandboxGateway(sandbox_orders)
    if kind == "odoo":
        required = ["ODOO_URL", "ODOO_DB", "ODOO_LOGIN", "ODOO_API_KEY"]
        missing = [name for name in required if not env.get(name)]
        if missing:
            raise ConfigError(f"ERP_GATEWAY=odoo requiere {', '.join(missing)}.")
        return OdooGateway(env["ODOO_URL"], env["ODOO_DB"], env["ODOO_LOGIN"], env["ODOO_API_KEY"], env.get("ODOO_ALLOW_WRITE") == "true")
    raise ConfigError(f"ERP_GATEWAY desconocido: {kind}")
