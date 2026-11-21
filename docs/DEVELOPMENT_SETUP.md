# Local Development Setup Guide

## Prerequisites

- **Node.js**: v20 or later (v22 recommended)
- **npm**: v10 or later
- **Python**: v3.11 or later (v3.12 recommended)
- **Git**

---

## 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment:
   ```bash
   copy .env.example .env
   ```

6. Run the test suite:
   ```bash
   pytest -v
   ```

7. Run code linting:
   ```bash
   ruff check .
   ```

8. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   API Docs will be live at: `http://localhost:8000/docs`

---

## 2. Frontend Setup (Next.js)

1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   copy .env.local.example .env.local
   ```

4. Run linting:
   ```bash
   npm run lint
   ```

5. Test production build:
   ```bash
   npm run build
   ```

6. Start local development server:
   ```bash
   npm run dev
   ```
   Frontend will be accessible at: `http://localhost:3000`

---

## 3. Verification Checklist

- [ ] FastAPI backend starts on port 8000 with CORS enabled for port 3000.
- [ ] Swagger UI opens at `http://localhost:8000/docs`.
- [ ] Next.js frontend loads at `http://localhost:3000`.
- [ ] Frontend home page verifies connectivity with the backend `/api/v1/health` endpoint.
