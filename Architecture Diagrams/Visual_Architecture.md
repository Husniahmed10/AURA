# 🔮 AURA — Visual Architecture
### Automated Universal Red-teaming Agent

> **Project:** AURA — Automated Universal Red-teaming Agent  
> **Focus:** Backend Architecture (Frontend TBD — possibly Next.js)  
> **Date:** September 2026

---

## 1. System Architecture (Full Stack Layers)

This diagram shows the **entire system** broken into 5 layers — from the API entry point down to the infrastructure.

![System Architecture — 5 layers from API to Infrastructure](C:/Users/husni/.gemini/antigravity-ide/brain/ce959cfc-b697-495f-819c-0d4dc056c1c1/system_architecture_visual_1788797775558.jpg)

| Layer | What It Does | Key Technologies |
|---|---|---|
| **API Layer** | Entry point — how users interact with the system | FastAPI, CLI, Webhooks |
| **Orchestration Layer** | The brain — decides what agents to run and when | LangGraph State Machine |
| **Agent Layer** | 4 specialized AI agents that do the actual work | Recon, Attack, Evaluator, Report |
| **Tool Layer** | External tools/libraries the agents use | PyRIT, RAG, Guardrails, Portkey, DeepEval, RAGAS |
| **Infrastructure Layer** | Databases, tracing, and LLM providers | Redis, ChromaDB, Langsmith, Logfire, OpenAI/Anthropic/Google |

---

## 2. Agentic Workflow Architecture

This diagram shows **how the 4 agents work together** — the pipeline flow from reconnaissance to final report, with shared services underneath.

![Agentic Workflow — 4 agents in a left-to-right pipeline with shared services below](C:/Users/husni/.gemini/antigravity-ide/brain/ce959cfc-b697-495f-819c-0d4dc056c1c1/agentic_architecture_visual_1788797792499.jpg)

### Agent Pipeline Summary

| Agent | Input | What It Does | Output |
|---|---|---|---|
| **🔍 Recon Agent** | Target URL | Probes, fingerprints model, maps attack surface | `ReconData` |
| **⚔️ Attack Agent** | ReconData | Fires PyRIT attacks (injection, jailbreak, extraction) | `AttackResults[]` |
| **📊 Evaluator Agent** | AttackResults | Scores with DeepEval + RAGAS, assigns CVSS severity | `EvalScores[]` |
| **📝 Report Agent** | EvalScores | Generates PDF report + JSON + fix recommendations | `SecurityReport` |

### Shared Services (Used by All Agents)

| Service | Purpose |
|---|---|
| **Redis** | State management, caching, attack deduplication, agent queues |
| **Langsmith** | Full execution tracing — every agent action is recorded |
| **Logfire** | Metrics & monitoring — latency, cost, error rates |
| **Portkey** | LLM routing — sends requests to the best model for each task |

---

## 3. Data Flow Architecture

This diagram traces **one complete scan request** from the moment a user submits a target URL to the final security report — step by step.

![Data Flow — 8 steps from User Input through all agents to Final Output](C:/Users/husni/.gemini/antigravity-ide/brain/ce959cfc-b697-495f-819c-0d4dc056c1c1/data_flow_architecture_1788797845170.jpg)

### Step-by-Step Breakdown

| Step | What Happens | Data Passed |
|---|---|---|
| **1. User Input** | User submits target URL, scope, sensitivity via API | `ScanConfig` |
| **2. Orchestrator** | Creates scan_id, stores state in Redis, starts Langsmith trace | `scan_id` |
| **3. Recon Agent** | 30 probe requests → fingerprint model → discover guardrails | `ReconData` |
| **4. Attack Planner** | RAG retrieves strategies → Portkey picks LLM → builds queue | `AttackPlan[]` |
| **5. Attack Agent** | PyRIT generates + fires attacks → caches in Redis → traces in Logfire | `AttackResult[]` |
| **6. Evaluator** | DeepEval + RAGAS scores → CVSS severity → success/fail | `EvalScore[]` |
| **7. Report Agent** | Aggregates findings → generates PDF + JSON → fix recommendations | `SecurityReport` |
| **8. Final Output** | PDF report, JSON data, Langsmith trace URL, Logfire dashboard | Downloadable via API |

---

## 4. Infrastructure Architecture

This diagram shows **how the system is deployed** — what runs locally in Docker vs what connects to external cloud services.

![Infrastructure — Docker Compose with FastAPI, Redis, ChromaDB and external cloud services](C:/Users/husni/.gemini/antigravity-ide/brain/ce959cfc-b697-495f-819c-0d4dc056c1c1/infrastructure_architecture_1788797866567.jpg)

### Local Services (Docker Compose)

| Service | Port | Purpose |
|---|---|---|
| **FastAPI App** | `8000` | Backend API + Agent orchestration |
| **Redis 7.x** | `6379` | State management, caching, queues |
| **ChromaDB** | `8001` | Vector database for RAG knowledge base |

### External Cloud Services

| Service | Purpose |
|---|---|
| **Portkey API** | Routes LLM requests to the cheapest/fastest/best model |
| **Langsmith** | Stores full execution traces for audit and debugging |
| **Logfire** | Collects performance metrics and monitoring data |

### LLM Providers (via Portkey)

| Provider | Best Used For |
|---|---|
| **OpenAI (GPT-4o)** | Attack generation — most creative for jailbreaks |
| **Anthropic (Claude)** | Report writing — best long-form analysis |
| **Google (Gemini)** | Evaluation scoring — follows rubrics precisely |

---

## 🗂️ How These Diagrams Connect

```
System Architecture    →  "What are the layers of the system?"
Agentic Workflow       →  "How do the agents work together?"
Data Flow              →  "What happens when a user starts a scan?"
Infrastructure         →  "How is it deployed and connected?"
```

> [!NOTE]
> **Frontend is intentionally excluded** from these diagrams. The backend is designed **API-first** with FastAPI, so any frontend (Next.js, React, etc.) can plug in later by consuming the REST API endpoints.

---

*All diagrams represent the backend architecture of the AI Red Teaming Agent project.*
