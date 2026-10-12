"""Función serverless de Vercel (runtime de Python). Expone el mismo handler que el servidor local."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from erp_service.web import ErpHandler  # noqa: E402


class handler(ErpHandler):  # noqa: N801 (Vercel busca una clase llamada «handler»)
    pass
