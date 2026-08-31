"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth, materials, matching, mapping, analytics, admin

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Driven Material Master Harmonization for CPSEs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "sih_problem_id": 26099,
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(materials.router, prefix=f"{API_PREFIX}/materials", tags=["Materials"])
app.include_router(matching.router, prefix=f"{API_PREFIX}/matching", tags=["Matching"])
app.include_router(mapping.router, prefix=f"{API_PREFIX}/mapping", tags=["CNMC Mapping"])
app.include_router(analytics.router, prefix=f"{API_PREFIX}/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])