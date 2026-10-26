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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
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


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": "development" if settings.DEBUG else "production",
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to Sunrise Interiors – Project & Workflow Management API",
        "docs": "/docs",
        "health": "/api/health",
    }
