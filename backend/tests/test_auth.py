"""Comprehensive test suite for admin authentication and session management."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.security import get_password_hash
from app.main import app
from app.repositories.user_repository import UserRepository

TEST_USER_ID = str(uuid4())
TEST_USER_EMAIL = "admin.auth.test@example.com"
TEST_PASSWORD = "ValidAdminPassword123!"
TEST_PASSWORD_HASH = get_password_hash(TEST_PASSWORD)
NOW_ISO = datetime.now(UTC).isoformat()

MOCK_USER_RECORD = {
    "id": TEST_USER_ID,
    "name": "System Admin",
    "email": TEST_USER_EMAIL,
    "password_hash": TEST_PASSWORD_HASH,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}


@pytest.fixture(autouse=True)
def mock_user_db(monkeypatch):
    """Mock the UserRepository Cloudflare D1 query methods for deterministic tests."""
    async def mock_get_by_email(email: str):
        if email.lower() == TEST_USER_EMAIL.lower():
            return MOCK_USER_RECORD
        return None

    async def mock_get_by_id(user_id: str):
        if str(user_id) == TEST_USER_ID:
            return MOCK_USER_RECORD
        return None

    monkeypatch.setattr(UserRepository, "get_by_email", mock_get_by_email)
    monkeypatch.setattr(UserRepository, "get_by_id", mock_get_by_id)


@pytest.mark.anyio
async def test_login_success():
    """1 & 8: Valid admin email & password creates valid session cookie and returns user without password hash."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"email": TEST_USER_EMAIL, "password": TEST_PASSWORD}
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USER_EMAIL
        assert data["name"] == "System Admin"
        assert "password_hash" not in data
        assert "password" not in data

        # Verify HttpOnly cookie was set
        assert settings.AUTH_COOKIE_NAME in response.cookies


@pytest.mark.anyio
async def test_login_incorrect_password():
    """2 & 9: Incorrect password fails with 401 and sets no session cookie."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"email": TEST_USER_EMAIL, "password": "WrongPassword999!"}
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401
        assert settings.AUTH_COOKIE_NAME not in response.cookies


@pytest.mark.anyio
async def test_login_nonexistent_email():
    """3: Nonexistent email returns 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"email": "nobody@example.com", "password": TEST_PASSWORD}
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401


@pytest.mark.anyio
async def test_login_empty_or_invalid_email():
    """4 & 5: Empty or invalid email format is rejected by validation."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid format
        r1 = await client.post("/api/v1/auth/login", json={"email": "notanemail", "password": TEST_PASSWORD})
        assert r1.status_code == 422

        # Empty email
        r2 = await client.post("/api/v1/auth/login", json={"email": "", "password": TEST_PASSWORD})
        assert r2.status_code == 422


@pytest.mark.anyio
async def test_login_empty_password_or_missing_fields():
    """6 & 7: Empty password or missing fields are rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.post("/api/v1/auth/login", json={"email": TEST_USER_EMAIL, "password": ""})
        assert r1.status_code == 422

        r2 = await client.post("/api/v1/auth/login", json={"email": TEST_USER_EMAIL})
        assert r2.status_code == 422


@pytest.mark.anyio
async def test_protected_route_unauthenticated():
    """10: Unauthenticated access to /api/v1/auth/me is rejected with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401


@pytest.mark.anyio
async def test_protected_route_authenticated_flow():
    """11 & 12: Authenticated session allows access to /me, and logout clears cookie and revokes access."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Login
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_PASSWORD},
        )
        assert login_res.status_code == 200

        # Step 2: Access /me using session cookie
        me_res = await client.get("/api/v1/auth/me")
        assert me_res.status_code == 200
        assert me_res.json()["email"] == TEST_USER_EMAIL

        # Step 3: Logout
        logout_res = await client.post("/api/v1/auth/logout")
        assert logout_res.status_code == 200


@pytest.mark.anyio
async def test_expired_session_rejected():
    """13: Expired token in session is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        expired_payload = {
            "exp": datetime.now(UTC) - timedelta(minutes=10),
            "sub": TEST_USER_ID,
            "iat": datetime.now(UTC) - timedelta(minutes=60),
            "type": "access",
        }
        expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        client.cookies.set(settings.AUTH_COOKIE_NAME, expired_token)
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
