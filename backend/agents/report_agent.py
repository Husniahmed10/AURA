"""
AURA - Report Agent
Aggregates all evaluation scores, calculates the final risk score,
and generates the executive summary via LLM.
Produces final SecurityReport and triggers PDF/JSON generation.
"""

from datetime import datetime, timezone

from orchestrator.state import ScanState, ScanStatus, SecurityReport, VulnerabilityFinding, Severity
from observability.logfire_setup import agent_span, log_scan_event
from cache.redis_manager import redis_manager
from gateway.portkey_config import get_llm
from reports.report_generator import generate_pdf, generate_json


async def generate_executive_summary(target_url: str, findings: list[VulnerabilityFinding], risk_score: float) -> str:
    """Use the LLM (Portkey) to write a professional executive summary."""
    if not findings:
        return f"The security assessment of {target_url} found no vulnerabilities. The target successfully blocked all attempted attacks and demonstrated strong security guardrails."

    llm = get_llm(task="report", temperature=0.3)
    
    findings_summary = "\n".join(
        f"- {f.category} (Severity: {f.severity}, CVSS: {f.cvss_score})" 
        for f in findings
    )
    
    prompt = f"""
    You are a professional cybersecurity red teamer. Write an executive summary for a penetration test report.
    
    Target: {target_url}
    Overall Risk Score: {risk_score}/10.0
    Vulnerabilities Found:
    {findings_summary}
    
    Instructions:
    1. Write a 2-3 paragraph professional executive summary.
    2. Summarize the overall security posture and the main risks discovered.
    3. Keep it objective, clear, and action-oriented for executives.
    4. Do NOT use markdown headers, just plain paragraphs.
    """
    
    try:
        response = await llm.ainvoke(prompt)
        return response.content
    except Exception as e:
        print(f"  [Report Error] Summary generation failed: {e}")
        return "Executive summary generation failed due to an error."


def get_recommendation_for_category(category: str) -> str:
    """Provide standard remediation advice based on attack category."""
    recs = {
        "prompt_injection": "Implement strict input validation and use an LLM gateway (like Nemo Guardrails) to filter out prompt injection attempts. Consider fine-tuning the model to recognize and refuse instruction overrides.",
        "data_extraction": "Ensure the system prompt does not contain hardcoded secrets, API keys, or passwords. Any sensitive backend credentials should be handled by the application logic, not exposed to the LLM context window.",
        "guardrail_bypass": "Enhance content moderation filters. Relying purely on keyword matching is insufficient; implement semantic filtering and evaluate user inputs with a dedicated safety classifier before passing them to the main LLM.",
        "jailbreak": "Improve the model's safety alignment. Multi-turn attacks (like Crescendo) often bypass static filters; implement stateful monitoring that analyzes the entire conversation history for harmful intent.",
        "agent_specific": "Enforce strict Role-Based Access Control (RBAC) on the tools the agent can call. The LLM should never have direct, unauthenticated access to run arbitrary commands, read sensitive files, or alter databases."
    }
    return recs.get(category, "Review the implementation logic and apply standard security hardening practices.")


@agent_span("report")
async def run_report(state: ScanState) -> ScanState:
    """
    Generate the final security report.
    Aggregates findings, calculates risk score, writes summary, and builds PDF.
    """
    scan_id = state["scan_id"]
    target_url = state["target_url"]
    eval_scores = state.get("eval_scores", [])
    
    log_scan_event(scan_id, "report_generation_started")
    await redis_manager.update_scan_status(scan_id, ScanStatus.REPORTING.value)
    
    print("\n  Generating Final Report...")
    
    # -- 1. Aggregate Findings --
    vulnerabilities = []
    total_cvss = 0.0
    max_cvss = 0.0
    
    for score in eval_scores:
        if score.get("success"):
            # This was a successful attack that bypassed defenses
            attack = next((a for a in state.get('attack_results', []) if a['attack_id'] == score['attack_id']), {})
            cat = attack.get('category', 'prompt_injection')
            cvss = score.get("cvss_score", 0.0)
            
            finding = VulnerabilityFinding(
                title=f"Bypass via {score.get('attack_type', cat)}",
                category=cat,
                severity=score.get("severity", Severity.INFO),
                cvss_score=cvss,
                description=score.get("details", ""),
                attack_payload="",  # Omitted for brevity in report, can be added if needed
                target_response="",
                recommendation=get_recommendation_for_category(cat)
            )
            vulnerabilities.append(finding)
            total_cvss += cvss
            if cvss > max_cvss:
                max_cvss = cvss
                
    # Sort vulnerabilities by CVSS (highest first)
    vulnerabilities.sort(key=lambda x: x.cvss_score, reverse=True)
    
    # -- 2. Calculate Overall Risk Score --
    # Weighted average: Heavily influenced by the highest CVSS score
    if vulnerabilities:
        avg_cvss = total_cvss / len(vulnerabilities)
        overall_risk = round((max_cvss * 0.7) + (avg_cvss * 0.3), 1)
    else:
        overall_risk = 0.0
        
    # -- 3. Generate Executive Summary --
    exec_summary = await generate_executive_summary(target_url, vulnerabilities, overall_risk)
    
    # -- 4. Build Report Object --
    total_attacks = len(state.get("attack_results", []))
    success_rate = round((len(vulnerabilities) / max(total_attacks, 1)) * 100, 1)
    
    report = SecurityReport(
        scan_id=scan_id,
        target_url=target_url,
        overall_risk_score=overall_risk,
        total_attacks=total_attacks,
        successful_attacks=len(vulnerabilities),
        success_rate=success_rate,
        vulnerabilities=vulnerabilities,
        executive_summary=exec_summary
    )
    
    report_dict = report.model_dump()
    
    # -- 5. Generate PDF & JSON files --
    pdf_path = generate_pdf(report_dict)
    json_path = generate_json(report_dict)
    print(f"    Saved PDF: {pdf_path}")
    print(f"    Saved JSON: {json_path}")
    
    # -- 6. Update State & Redis --
    state["report"] = report_dict
    state["status"] = ScanStatus.COMPLETED.value
    
    await redis_manager.update_scan_field(scan_id, "report", report_dict)
    await redis_manager.update_scan_status(scan_id, ScanStatus.COMPLETED.value)
    
    log_scan_event(scan_id, "report_generation_completed", {"risk_score": overall_risk})
    
    return state
