# API Documentation (v1)

## Base URL
```
http://localhost:8000/api/v1
```

Interactive documentation is available via:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

---

## Initial Endpoints

### 1. Root Information
- **Route**: `GET /api/v1`
- **Summary**: Returns metadata about the service.
- **Response**:
  ```json
  {
    "name": "Bible Quiz Platform API",
    "version": "0.1.0",
    "docs_url": "/docs",
    "api_v1": "/api/v1",
    "status": "online"
  }
  ```

### 2. Application Health Probe
- **Route**: `GET /api/v1/health`
- **Summary**: Liveness probe confirming service health.
- **Response**:
  ```json
  {
    "status": "healthy",
    "environment": "development",
    "version": "0.1.0",
    "timestamp": "2026-11-21T17:35:25.415254Z"
  }
  ```

### 3. Application Readiness Probe
- **Route**: `GET /api/v1/health/ready`
- **Summary**: Readiness probe confirming operational state of subsystems.
- **Response**:
  ```json
  {
    "status": "ready",
    "subsystems": {
      "api": "operational",
      "memory": "operational"
    },
    "timestamp": "2026-11-21T17:35:25.415254Z"
  }
  ```
