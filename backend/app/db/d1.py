"""Cloudflare D1 Database Client and Execution Service."""

from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger


class D1Client:
    """Async client interacting with Cloudflare D1 REST API with connection pooling."""

    def __init__(self) -> None:
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.database_id = settings.CLOUDFLARE_D1_DATABASE_ID
        self.endpoint = (
            f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/d1/database/{self.database_id}/query"
        )
        self._client: httpx.AsyncClient | None = None

    def is_configured(self) -> bool:
        return bool(self.api_token and self.account_id and self.database_id)

    async def get_http_client(self) -> httpx.AsyncClient:
        """Reuse persistent HTTP connection pool for fast throughput."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=12.0,
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=60.0),
            )
        return self._client

    async def execute(self, sql: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
        """Execute a parameterized SQL statement against Cloudflare D1."""
        if not self.is_configured():
            logger.error("Cloudflare D1 is not configured in settings.")
            raise AppException("Database configuration is missing", status_code=500)

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {"sql": sql}
        if params is not None:
            payload["params"] = params

        try:
            client = await self.get_http_client()
            response = await client.post(self.endpoint, headers=headers, json=payload)
            data = response.json()

            if not data.get("success"):
                errors = data.get("errors", [])
                logger.error(f"Cloudflare D1 query error: {errors}")
                raise AppException("Database query execution failed", status_code=500, details=errors)

            results_wrapper = data.get("result", [])
            if results_wrapper and "results" in results_wrapper[0]:
                return results_wrapper[0]["results"]
            return []
        except httpx.RequestError as exc:
            logger.error(f"Network error connecting to Cloudflare D1: {exc!s}")
            raise AppException("Failed to communicate with database cluster", status_code=503) from exc


d1_client = D1Client()
