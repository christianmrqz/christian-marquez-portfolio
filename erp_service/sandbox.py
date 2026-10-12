"""Datos ficticios de la demo. Ninguna empresa, pedido ni producto corresponde a un cliente real.

Las fechas se calculan respecto al día de referencia para que la demo tenga sentido cualquier día que se visite.
"""

from __future__ import annotations

from datetime import date, timedelta

from .domain import Order, OrderLine, Product, to_json

CATALOG: list[Product] = [
    Product("TOR-M6-40", "Tornillo M6 x 40 (caja 100 u.)", ["tornillo m6", "tornillos m6", "tornillo de m6", "tornillos de m6"]),
    Product("TAC-08", "Taco de nailon 8 mm (caja 100 u.)", ["taco 8", "tacos 8", "taco de 8", "tacos de 8", "taco de nailon", "tacos de nailon"]),
    Product("BRO-10", "Broca para hormigón 10 mm", ["broca 10", "brocas 10", "broca de 10", "brocas de 10"]),
    Product("CIN-50", "Cinta americana 50 mm", ["cinta americana", "cintas americanas"]),
]

CUSTOMERS = ["Ferretería Alameda", "Talleres Ribera", "Reformas Vega"]


def seed_orders(today: date) -> list[Order]:
    return [
        Order(
            ref="SO-1042",
            customer="Ferretería Alameda",
            state="sale",
            commitment_date=(today + timedelta(days=16)).isoformat(),
            lines=[
                OrderLine(1, "TOR-M6-40", "Tornillo M6 x 40 (caja 100 u.)", 25),
                OrderLine(2, "TAC-08", "Taco de nailon 8 mm (caja 100 u.)", 10),
            ],
        ),
        Order(
            ref="SO-1043",
            customer="Talleres Ribera",
            state="done",
            commitment_date=(today - timedelta(days=5)).isoformat(),
            lines=[OrderLine(3, "BRO-10", "Broca para hormigón 10 mm", 8)],
        ),
        Order(
            ref="SO-1044",
            customer="Reformas Vega",
            state="draft",
            commitment_date=(today + timedelta(days=30)).isoformat(),
            lines=[
                OrderLine(4, "CIN-50", "Cinta americana 50 mm", 12),
                OrderLine(5, "BRO-10", "Broca para hormigón 10 mm", 4),
            ],
        ),
    ]


def seed_payload(today: date) -> dict:
    return {
        "orders": to_json(seed_orders(today)),
        "catalog": to_json(CATALOG),
        "customers": CUSTOMERS,
    }
