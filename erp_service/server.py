"""Servidor local de desarrollo: python -m erp_service.server [puerto]"""

from __future__ import annotations

import sys
from http.server import ThreadingHTTPServer

from .web import ErpHandler


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    server = ThreadingHTTPServer(("127.0.0.1", port), ErpHandler)
    print(f"Servicio ERP en http://127.0.0.1:{port}/api/erp?op=health", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
