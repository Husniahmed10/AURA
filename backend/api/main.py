"""
AURA - Main API Entrypoint
FastAPI application with Logfire tracing and route registration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logfire

from config.settings import settings
from api.routes import scans, reports, health
from cache.redis_manager import redis_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Redis
    print("Starting AURA API - Connecting to Redis...")
    await redis_manager.connect()
    yield
    # Shutdown: Disconnect Redis
    print("Shutting down AURA API - Disconnecting Redis...")
    await redis_manager.disconnect()


app = FastAPI(
    title="AURA (Automated Universal Red-teaming Agent)",
    description="API for the AURA LLM Penetration Testing framework.",
    version="0.1.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Logfire tracing
if settings.LOGFIRE_TOKEN:
    logfire.configure(token=settings.LOGFIRE_TOKEN)
    logfire.instrument_fastapi(app)

# Register routes
app.include_router(scans.router)
app.include_router(reports.router)
app.include_router(health.router)


@app.get("/")
async def root():
    return {"message": "Welcome to AURA API. Visit /docs for the API reference."}
