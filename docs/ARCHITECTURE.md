# Architecture Specification: Bible Quiz Platform

## 1. System Overview

The Bible Quiz Platform is designed as a decoupled, multi-tier enterprise web application:
- **Presentation Tier**: Next.js (App Router, React 19, TypeScript, Tailwind CSS)
- **API & Application Tier**: Python FastAPI (Pydantic v2, ASGI, Structured Layering)
- **Data & Edge Infrastructure Tier**: Cloudflare D1 (Distributed SQLite at edge) + Cloudflare Workers

```
[ Next.js Client / Edge SSR ]
             │
             │ HTTPS / REST (JSON)
             ▼
[ Python FastAPI Backend Engine ]
             │
             ├── Local Dev: In-memory / Direct local SQLite mock
             │
             └── Cloudflare D1 Integration:
                 ├── Pattern A: Cloudflare D1 REST API (Cloudflare Client API)
                 └── Pattern B: Internal Cloudflare Worker Microservice (RPC/HTTP bridge)
```

## 2. Layer Separation & Responsibilities

### Frontend Layer (`frontend/src/`)
- `app/`: Next.js App Router root layout, error boundaries, loading skeletons, and pages.
- `components/`: Pure, presentation components organized into `layout/` and `common/`.
- `services/`: Centralized HTTP communication layer using typed fetch client. No direct fetch calls in UI components.
- `types/`: Strict TypeScript data contracts mirroring backend response schemas.
- `lib/`: Configuration and runtime environment wrappers.

### Backend Layer (`backend/app/`)
- `api/v1/`: Versioned API routing and endpoint declarations.
- `core/`: Environment settings (`pydantic-settings`), custom exceptions, and structured logging.
- `schemas/`: Pydantic input validation and output serialization models.
- `services/`: Domain business logic independent of transport protocols.
- `repositories/`: Data access abstraction prepared for database queries.
- `db/`: Database drivers, connection managers, and migration hooks.

## 3. Cloudflare D1 Database Integration Architecture

Cloudflare D1 runs directly on the Cloudflare edge runtime (V8 isolates), which means standard Python drivers (such as `sqlite3` or Python ODBC/JDBC drivers) cannot establish direct TCP socket connections from external servers to D1.

For this enterprise platform, we specify two production-grade integration architectures:

### Recommended Option: Cloudflare D1 HTTP API Client
- Python's `httpx` async client securely calls the Cloudflare D1 API endpoint:
  `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query`
- **Authentication**: Bearer Token with targeted D1 edit permissions.
- **Benefits**: No extra edge microservice needed to maintain; queries are executed directly over HTTP with parameterized SQL.
- **Implementation Layer**: Placed inside `backend/app/repositories/` behind an abstract repository protocol.

### Alternative Option: Cloudflare Worker RPC / Internal Microservice
- A lightweight TypeScript Cloudflare Worker acts as a localized data-gateway service exposing an internal, authenticated endpoint.
- Provides sub-millisecond query execution on edge with caching (KV / Cache API).

## 4. Security & Compliance
- Strict CORS policies configured.
- Zero secrets stored in source code.
- Sanitized input validation through Pydantic V2 schemas.
