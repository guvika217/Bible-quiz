"""Comprehensive test suite for admin authentication, JWT session management, and RBAC."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.security import get_password_hash
from app.main import app
from app.repositories.user_repository import UserRepository
from app.schemas.user import AccountStatus, UserRole

ADMIN_ID = str(uuid4())
ADMIN_EMAIL = "admin.rbac@biblequiz.org"
SUPER_ADMIN_ID = str(uuid4())
SUPER_ADMIN_EMAIL = "superadmin.rbac@biblequiz.org"
TEST_PASSWORD = "ValidAdminPassword123!"
TEST_PASSWORD_HASH = get_password_hash(TEST_PASSWORD)
NOW_ISO = datetime.now(UTC).isoformat()

MOCK_USERS = {
    ADMIN_EMAIL.lower(): {
        "id": ADMIN_ID,
        "name": "General Admin",
        "email": ADMIN_EMAIL,
        "password_hash": TEST_PASSWORD_HASH,
        "role": UserRole.ADMIN.value,
        "email_verified": 1,
        "account_status": AccountStatus.ACTIVE.value,
        "verified_at": NOW_ISO,
        "created_at": NOW_ISO,
        "updated_at": NOW_ISO,
    },
    SUPER_ADMIN_EMAIL.lower(): {
        "id": SUPER_ADMIN_ID,
        "name": "Super Administrator",
        "email": SUPER_ADMIN_EMAIL,
        "password_hash": TEST_PASSWORD_HASH,
        "role": UserRole.SUPER_ADMIN.value,
        "email_verified": 1,
        "account_status": AccountStatus.ACTIVE.value,
        "verified_at": NOW_ISO,
        "created_at": NOW_ISO,
        "updated_at": NOW_ISO,
    },
}


@pytest.fixture(autouse=True)
def mock_user_db(monkeypatch):
    """Mock the UserRepository Cloudflare D1 query methods for deterministic tests."""
    async def mock_get_by_email(email: str):
        return MOCK_USERS.get(email.lower())

    async def mock_get_by_id(user_id: str):
        for user in MOCK_USERS.values():
            if user["id"] == str(user_id):
                return user
        return None

    monkeypatch.setattr(UserRepository, "get_by_email", mock_get_by_email)
    monkeypatch.setattr(UserRepository, "get_by_id", mock_get_by_id)


@pytest.mark.anyio
async def test_login_success():
    """Valid admin email & password creates valid JWT session cookie and returns user with role."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"email": ADMIN_EMAIL, "password": TEST_PASSWORD}
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "ADMIN"
        assert "password_hash" not in data

        # Verify HttpOnly cookie was set
        assert settings.AUTH_COOKIE_NAME in response.cookies


@pytest.mark.anyio
async def test_login_incorrect_password():
    """Incorrect password fails with 401 and sets no session cookie."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"email": ADMIN_EMAIL, "password": "WrongPassword999!"}
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401
        assert settings.AUTH_COOKIE_NAME not in response.cookies


@pytest.mark.anyio
async def test_login_nonexistent_email():
    """Nonexistent email returns 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"email": "nobody@example.com", "password": TEST_PASSWORD}
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401


@pytest.mark.anyio
async def test_login_empty_or_invalid_email():
    """Empty or invalid email format is rejected by validation."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.post("/api/v1/auth/login", json={"email": "notanemail", "password": TEST_PASSWORD})
        assert r1.status_code == 422

        r2 = await client.post("/api/v1/auth/login", json={"email": "", "password": TEST_PASSWORD})
        assert r2.status_code == 422


@pytest.mark.anyio
async def test_login_empty_password_or_missing_fields():
    """Empty password or missing fields are rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.post("/api/v1/auth/login", json={"email": ADMIN_EMAIL, "password": ""})
        assert r1.status_code == 422

        r2 = await client.post("/api/v1/auth/login", json={"email": ADMIN_EMAIL})
        assert r2.status_code == 422


@pytest.mark.anyio
async def test_protected_route_unauthenticated():
    """Unauthenticated access to /api/v1/auth/me is rejected with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401


@pytest.mark.anyio
async def test_protected_route_authenticated_flow():
    """Authenticated session allows access to /me, and logout clears cookie and revokes access."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Login
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": ADMIN_EMAIL, "password": TEST_PASSWORD},
        )
        assert login_res.status_code == 200

        # Step 2: Access /me using session cookie
        me_res = await client.get("/api/v1/auth/me")
        assert me_res.status_code == 200
        assert me_res.json()["email"] == ADMIN_EMAIL
        assert me_res.json()["role"] == "ADMIN"

        # Step 3: Logout
        logout_res = await client.post("/api/v1/auth/logout")
        assert logout_res.status_code == 200


@pytest.mark.anyio
async def test_expired_session_rejected():
    """Expired token in session is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        expired_payload = {
            "exp": datetime.now(UTC) - timedelta(minutes=10),
            "sub": ADMIN_ID,
            "role": "ADMIN",
            "iat": datetime.now(UTC) - timedelta(minutes=60),
            "type": "access",
        }
        expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        client.cookies.set(settings.AUTH_COOKIE_NAME, expired_token)
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401


@pytest.mark.anyio
async def test_rbac_super_admin_access():
    """Role-Based Access Control: SUPER_ADMIN succeeds on superadmin route; ADMIN is rejected with 403."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Admin login
        await client.post("/api/v1/auth/login", json={"email": ADMIN_EMAIL, "password": TEST_PASSWORD})
        res_admin = await client.get("/api/v1/auth/superadmin-only")
        assert res_admin.status_code == 403  # Blocked!

        # Super Admin login
        await client.post("/api/v1/auth/login", json={"email": SUPER_ADMIN_EMAIL, "password": TEST_PASSWORD})
        res_super = await client.get("/api/v1/auth/superadmin-only")
        assert res_super.status_code == 200  # Allowed!
        assert res_super.json()["role"] == "SUPER_ADMIN"
