"""
AURA - Health API Routes
Check system health and dependency connectivity.
"""

from fastapi import APIRouter
from api.schemas import HealthResponse
from cache.redis_manager import redis_manager
from config.settings import settings

router = APIRouter(prefix="/api/v1", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if all backing services are connected and healthy."""
    
    # Check Redis
    redis_connected = False
    try:
        redis_connected = await redis_manager.ping()
    except Exception:
        pass
        
    # Check Pinecone (simple key presence check)
    pinecone_connected = bool(settings.PINECONE_API_KEY)
    
    status = "healthy" if redis_connected else "degraded"
    
    return HealthResponse(
        status=status,
        redis_connected=redis_connected,
        pinecone_connected=pinecone_connected
    )
