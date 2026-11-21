# Backend Service: Bible Quiz Platform

Production-ready FastAPI backend for the Bible Quiz Platform.

## Features
- Structured modular architecture (`api`, `core`, `services`, `repositories`, `schemas`, `models`)
- Pydantic v2 settings and data validation
- Centralized exception handling and structured logging
- Automatic OpenAPI/Swagger generation
- Pytest and Ruff pre-configured

## Quickstart
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
pytest -v
uvicorn app.main:app --reload --port 8000
```
Interactive docs: `http://localhost:8000/docs`
