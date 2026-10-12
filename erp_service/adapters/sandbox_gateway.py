from __future__ import annotations

import copy

from ..domain import Order, Proposal
from ..ports import ConflictError


class SandboxGateway:
    """ERP simulado en memoria con pedidos ficticios. No es Odoo: solo reproduce su comportamiento básico.

    El servicio no guarda estado (funciona como función serverless): el navegador envía el estado del sandbox
    de su sesión y recibe el pedido actualizado.
    """

    name = "sandbox"
    simulated = True

    def __init__(self, orders: list[Order]):
        self._orders = {o.ref: copy.deepcopy(o) for o in orders}
        self.messages: list[str] = []

    def find_order(self, ref: str) -> Order | None:
        order = self._orders.get(ref)
        return copy.deepcopy(order) if order else None

    def apply(self, proposal: Proposal, message: str) -> Order:
        order = self._orders.get(proposal.order_ref)
        if order is None:
            raise ConflictError(f"El pedido {proposal.order_ref} ya no existe.")
        # region: concurrencia
        if order.version != proposal.base_version:
            raise ConflictError(f"El pedido {order.ref} ha cambiado desde que se generó la propuesta. Vuelve a procesar la solicitud.")
        # endregion
        for change in proposal.changes:
            if change.field == "commitment_date":
                order.commitment_date = change.after
            elif change.line_id is not None:
                line = next((l for l in order.lines if l.line_id == change.line_id), None)
                if line is None:
                    raise ConflictError("Una línea del pedido ya no existe.")
                line.quantity = int(change.after)
        order.version = str(int(order.version) + 1)
        self.messages.append(message)
        return copy.deepcopy(order)
