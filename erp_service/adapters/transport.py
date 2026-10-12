"""POST JSON con urllib. Se inyecta en los adaptadores para poder probarlos sin red."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Callable

from ..ports import ProviderError

PostJson = Callable[[str, dict[str, str], dict[str, Any]], dict[str, Any]]


def post_json(url: str, headers: dict[str, str], body: dict[str, Any], timeout: float = 30) -> dict[str, Any]:
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        raise ProviderError(f"El proveedor respondió {error.code}.") from error
    except (urllib.error.URLError, TimeoutError) as error:
        raise ProviderError("No se pudo conectar con el proveedor.") from error
