# API Endpoints Documentation

This document describes the routing, paths, and metadata formats for the **Quantara** backend API.

---

## 🛠️ Infrastructure Endpoints

### Liveness and Connectivity Check
Verifies connections to PostgreSQL and Redis.
* **URL**: `/healthz`
* **Method**: `GET`
* **Response `200 OK` (Healthy)**:
  ```json
  {
    "status": "healthy",
    "environment": "production",
    "services": {
      "database": "connected",
      "cache": "connected"
    }
  }
  ```
* **Response `503 Service Unavailable` (Degraded)**:
  ```json
  {
    "status": "degraded",
    "environment": "production",
    "services": {
      "database": "disconnected",
      "cache": "connected"
    }
  }
  ```

---

## 📈 System router (`/api/v1`)

### Platform Metadata Info
Returns version status and system options.
* **URL**: `/api/v1/status`
* **Method**: `GET`
* **Response `200 OK`**:
  ```json
  {
    "platform": "Quantara",
    "api_version": "v1",
    "features_available": [
      "database_pools",
      "redis_cache",
      "asynchronous_health_probes",
      "pydantic_settings_validation"
    ]
  }
  ```
