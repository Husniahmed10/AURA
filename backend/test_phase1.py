"""
AURA - Phase 1 Test Script
Tests the Recon Agent against the dummy chatbot.

Usage:
    1. Start dummy chatbot: uvicorn target_app.dummy_chatbot:app --port 8001
    2. Run this script:     python test_phase1.py
"""

import asyncio
import json

from orchestrator.master_agent import run_scan_quick


async def main():
    print("=" * 60)
    print("  AURA - Phase 1 Test: Recon Agent")
    print("=" * 60)
    print()
    print("Target: http://localhost:8001")
    print("Running recon scan...")
    print()

    try:
        result = await run_scan_quick("http://localhost:8001")

        print("=" * 60)
        print("  SCAN RESULTS")
        print("=" * 60)
        print()
        print(f"Scan ID:  {result['scan_id']}")
        print(f"Status:   {result['status']}")
        print()

        recon = result.get("recon_data")
        if recon:
            print("--- RECON DATA ---")
            print(f"Model Type:       {recon.get('model_type', 'unknown')}")
            print(f"Model Confidence: {recon.get('model_confidence', 0)}")
            print(f"Guardrails:       {recon.get('guardrails_detected', [])}")
            print(f"Blocked Topics:   {recon.get('blocked_topics', [])}")
            print(f"Prompt Hints:     {recon.get('system_prompt_hints', [])}")
            print(f"Attack Surface:   {recon.get('attack_surface', [])}")
            print(f"Response Patterns: {recon.get('response_patterns', {})}")
        else:
            print("No recon data returned!")

        print()
        print("=" * 60)
        print("  Phase 1 test complete!")
        print("=" * 60)

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
