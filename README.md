# Bible Quiz Platform

Enterprise-level, scalable web platform for biblical knowledge quizzes, live competitions, and scripture studies.

## Tech Stack
- **Frontend**: Next.js (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Python 3.12, FastAPI, Pydantic v2, Uvicorn
- **Data & Cloud**: Prepared for Cloudflare D1 distributed edge database & Workers

## Project Structure
```
bible-quiz-platform/
├── frontend/           # Next.js App Router frontend application
│   ├── src/
│   │   ├── app/        # Pages, loading, error boundaries
│   │   ├── components/ # Reusable UI components
│   │   ├── services/   # Centralized API service layer
│   │   ├── types/      # TypeScript data contracts
│   │   └── lib/        # Environment and utility helpers
│   └── package.json
│
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── api/v1/     # Versioned endpoints
│   │   ├── core/       # Settings, logging, exceptions
│   │   ├── schemas/    # Pydantic validation schemas
│   │   ├── services/   # Business logic
│   │   └── repositories/ # Data access layer
│   ├── tests/          # Pytest suite
│   └── requirements.txt
│
└── docs/               # Technical documentation
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT_SETUP.md
    └── API_DOCUMENTATION.md
```

## Getting Started

### 1. Run Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Swagger UI: `http://localhost:8000/docs`

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Web App: `http://localhost:3000`

## Documentation
- [Architecture & Cloudflare D1 Integration Plan](docs/ARCHITECTURE.md)
- [Development Setup Guide](docs/DEVELOPMENT_SETUP.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
