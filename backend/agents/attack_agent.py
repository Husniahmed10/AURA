"""
AURA - Attack Agent
Orchestrates all attack strategies against the target.

Flow:
1. Read recon_data from LangGraph state
2. Query RAG (Pinecone) for best attack strategies
3. Run all 5 attack categories
4. Deduplicate and cache results in Redis
5. Return updated state
"""

from orchestrator.state import ScanState, ScanStatus, AttackCategory
from observability.logfire_setup import agent_span, log_attack, log_scan_event
from cache.redis_manager import redis_manager
from rag.attack_retriever import get_attack_strategies
from gateway.portkey_config import get_llm
from config.settings import settings

from pyrit_strategies.prompt_injection import run_prompt_injection_attacks
from pyrit_strategies.crescendo import run_crescendo_attacks
from pyrit_strategies.data_extraction import run_data_extraction_attacks
from pyrit_strategies.guardrail_bypass import run_guardrail_bypass_attacks
from pyrit_strategies.agent_attacks import run_agent_attacks


def should_run_category(
    category: AttackCategory,
    recon_data: dict,
    scope: list[str],
) -> bool:
    """Decide whether to run a category based on recon and scan scope."""
    # Check if category is in scope
    if scope and category.value not in scope:
        return False

    attack_surface = recon_data.get("attack_surface", [])
    guardrails = recon_data.get("guardrails_detected", [])

    # Always run these core categories
    if category in (
        AttackCategory.PROMPT_INJECTION,
        AttackCategory.DATA_EXTRACTION,
        AttackCategory.JAILBREAK,
    ):
        return True

    # Run guardrail bypass only if guardrails detected
    if category == AttackCategory.GUARDRAIL_BYPASS:
        return len(guardrails) > 0

    # Run agent attacks only if weak injection defense found
    if category == AttackCategory.AGENT_SPECIFIC:
        return "weak_injection_defense" in attack_surface

    return True


@agent_span("attack")
async def run_attacks(state: ScanState) -> ScanState:
    """
    Run all applicable attack strategies against the target.
    Uses recon data to prioritize the most relevant attacks.
    """
    scan_id = state["scan_id"]
    target_url = state["target_url"]
    recon_data = state.get("recon_data") or {}
    config = state.get("config", {})
    scope = config.get("scope", [c.value for c in AttackCategory])

    log_scan_event(scan_id, "attack_started", {"target": target_url})
    await redis_manager.update_scan_status(scan_id, ScanStatus.ATTACKING.value)

    model_used = settings.ATTACK_MODEL
    all_results = []

    # -- Step 1: Query RAG for best strategies ------------
    log_scan_event(scan_id, "rag_retrieval_started")
    try:
        strategies = get_attack_strategies(recon_data)
        log_scan_event(scan_id, "rag_retrieval_done", {
            "strategies_found": len(strategies)
        })
    except Exception as e:
        log_scan_event(scan_id, "rag_retrieval_failed", str(e))
        strategies = []

    # -- Step 2: Run attack categories -------------------
    attack_runners = [
        (AttackCategory.PROMPT_INJECTION, run_prompt_injection_attacks),
        (AttackCategory.JAILBREAK,        run_crescendo_attacks),
        (AttackCategory.DATA_EXTRACTION,  run_data_extraction_attacks),
        (AttackCategory.GUARDRAIL_BYPASS, run_guardrail_bypass_attacks),
        (AttackCategory.AGENT_SPECIFIC,   run_agent_attacks),
    ]

    for category, runner in attack_runners:
        if not should_run_category(category, recon_data, scope):
            print(f"  Skipping {category.value} (not in scope or not applicable)")
            continue

        try:
            print(f"\n  [{category.value.upper()}]")
            results = await runner(target_url, model_used, recon_data)

            # Deduplicate and cache each result
            for result in results:
                result["scan_id"] = scan_id

                # Skip duplicates
                is_dup = await redis_manager.is_duplicate_attack(
                    scan_id, result["payload"]
                )
                if is_dup:
                    continue

                # Cache to Redis
                await redis_manager.cache_attack_result(scan_id, result)
                all_results.append(result)

                # Log attack
                log_attack(
                    scan_id=scan_id,
                    attack_type=result["attack_type"],
                    payload=result["payload"],
                    success=result["success"],
                )

                # Stop if max attacks reached
                if len(all_results) >= config.get("max_attacks", settings.MAX_ATTACKS):
                    log_scan_event(scan_id, "max_attacks_reached", len(all_results))
                    break

        except Exception as e:
            log_scan_event(scan_id, "attack_category_error", {
                "category": category.value,
                "error": str(e),
            })
            print(f"  ERROR in {category.value}: {e}")
            continue

    # -- Step 3: Summary --------------------------------
    successful = sum(1 for r in all_results if r.get("success"))
    log_scan_event(scan_id, "attack_completed", {
        "total_attacks": len(all_results),
        "successful": successful,
        "success_rate": round(successful / max(len(all_results), 1), 2),
    })

    print(f"\n  Attack Summary:")
    print(f"    Total fired:  {len(all_results)}")
    print(f"    Successful:   {successful}")
    print(f"    Success rate: {round(successful / max(len(all_results), 1) * 100, 1)}%")

    # -- Step 4: Update LangGraph state -----------------
    state["attack_results"] = all_results
    state["status"] = ScanStatus.ATTACKING.value

    return state
