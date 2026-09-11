"""
AURA - Redis Manager
Handles all Redis operations:
- Scan state management (create, update, get)
- Attack result caching and deduplication
- Real-time progress tracking
"""

import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis

from config.settings import settings


class RedisManager:
    """Async Redis client for AURA scan state and caching."""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Initialize async Redis connection."""
        self.redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            protocol=2,  # Use RESP2 for older Redis versions
        )
        await self.redis.ping()
        return self

    async def disconnect(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()

    # -- Scan State Management --

    async def create_scan(self, scan_id: str, config: dict) -> dict:
        """Create a new scan entry in Redis."""
        scan_state = {
            "scan_id": scan_id,
            "status": "created",
            "config": config,
            "recon_data": None,
            "attack_results": [],
            "eval_scores": [],
            "report": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await self.redis.set(
            f"scan:{scan_id}",
            json.dumps(scan_state),
            ex=settings.REDIS_SCAN_TTL,
        )
        return scan_state

    async def get_scan(self, scan_id: str) -> Optional[dict]:
        """Retrieve full scan state."""
        data = await self.redis.get(f"scan:{scan_id}")
        if data:
            return json.loads(data)
        return None

    async def update_scan_status(self, scan_id: str, status: str):
        """Update the status field of a scan."""
        scan = await self.get_scan(scan_id)
        if scan:
            scan["status"] = status
            scan["updated_at"] = datetime.now(timezone.utc).isoformat()
            await self.redis.set(
                f"scan:{scan_id}",
                json.dumps(scan),
                ex=settings.REDIS_SCAN_TTL,
            )

    async def update_scan_field(self, scan_id: str, field: str, value):
        """Update any field in the scan state."""
        scan = await self.get_scan(scan_id)
        if scan:
            scan[field] = value
            scan["updated_at"] = datetime.now(timezone.utc).isoformat()
            await self.redis.set(
                f"scan:{scan_id}",
                json.dumps(scan),
                ex=settings.REDIS_SCAN_TTL,
            )

    # -- Attack Results --

    async def cache_attack_result(self, scan_id: str, result: dict):
        """Append an attack result to the scan's results list."""
        scan = await self.get_scan(scan_id)
        if scan:
            scan["attack_results"].append(result)
            scan["updated_at"] = datetime.now(timezone.utc).isoformat()
            await self.redis.set(
                f"scan:{scan_id}",
                json.dumps(scan),
                ex=settings.REDIS_SCAN_TTL,
            )

    async def is_duplicate_attack(self, scan_id: str, payload: str) -> bool:
        """Check if an attack payload has already been used in this scan."""
        payload_hash = hashlib.sha256(payload.encode()).hexdigest()
        key = f"scan:{scan_id}:attacks"
        added = await self.redis.sadd(key, payload_hash)
        await self.redis.expire(key, settings.REDIS_SCAN_TTL)
        return added == 0

    # -- Progress Tracking --

    async def get_scan_progress(self, scan_id: str) -> dict:
        """Get a summary of scan progress."""
        scan = await self.get_scan(scan_id)
        if not scan:
            return {"error": "Scan not found"}
        return {
            "scan_id": scan_id,
            "status": scan["status"],
            "attacks_completed": len(scan["attack_results"]),
            "max_attacks": scan["config"].get("max_attacks", settings.MAX_ATTACKS),
            "created_at": scan["created_at"],
            "updated_at": scan["updated_at"],
        }

    # -- Utility --

    async def delete_scan(self, scan_id: str):
        """Delete a scan and its associated data."""
        await self.redis.delete(f"scan:{scan_id}")
        await self.redis.delete(f"scan:{scan_id}:attacks")

    async def health_check(self) -> bool:
        """Check if Redis is reachable."""
        try:
            return await self.redis.ping()
        except Exception:
            return False


# Singleton instance
redis_manager = RedisManager()
