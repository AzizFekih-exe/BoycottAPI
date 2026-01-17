---
description: How to start the full development environment (Backend + Frontend)
---

### Step 1: Start Backend Services
Run Docker Compose from the root directory to start the PostgreSQL database and the Flask API.
// turbo
```bash
docker-compose up -d
```

### Step 2: Start Frontend Development Server
Navigate to the frontend directory and start the Vite dev server.
// turbo
```bash
cd frontend && npm run dev
```

> [!TIP]
> If you've modified backend code, use `docker-compose up -d --build` to refresh the API container.
