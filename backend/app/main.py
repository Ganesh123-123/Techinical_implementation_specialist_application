from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routers import (
    projects,
    leads,
    vendors,
    tasks,
    team,
    notifications,
    automations,
    dashboard,
    cleaning,
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Centralized Project & Workflow Management System for Sunrise Interiors studio in Bengaluru, India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Configure CORS
origins = settings.cors_origin_list
is_wildcard = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com" if not is_wildcard else None,
    allow_credentials=False if is_wildcard else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router)
app.include_router(leads.router)
app.include_router(vendors.router)
app.include_router(tasks.router)
app.include_router(team.router)
app.include_router(notifications.router)
app.include_router(automations.router)
app.include_router(dashboard.router)
app.include_router(cleaning.router)


from fastapi import HTTPException
from fastapi.responses import FileResponse, JSONResponse

@app.get("/api/health")
@app.head("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": "development" if settings.DEBUG else "production",
    }


# Static frontend serving (if frontend is built in frontend/dist)
frontend_dist = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "frontend",
    "dist",
)

if os.path.isdir(frontend_dist):
    assets_path = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="frontend_assets")

    @app.get("/")
    @app.head("/")
    async def serve_root():
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse({"status": "healthy", "service": "Sunrise Interiors"})

    @app.get("/{full_path:path}")
    @app.head("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        # If request is intended for an API or Docs route that didn't match:
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
        ):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        candidate = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    @app.head("/")
    def root():
        return {
            "message": "Welcome to Sunrise Interiors – Project & Workflow Management API",
            "docs": "/docs",
            "health": "/api/health",
        }
