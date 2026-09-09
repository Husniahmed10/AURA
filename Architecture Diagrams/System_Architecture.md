# 🔮 AURA — System Architecture Document
## Automated Universal Red-teaming Agent
> **Document Type:** System Architecture  
> **Version:** 1.0  
> **Date:** September 2026  
> **Audience:** Developers, Architects, Technical Reviewers

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Layers](#2-system-layers)
3. [Component Architecture](#3-component-architecture)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Technology Integration Map](#5-technology-integration-map)
6. [Infrastructure Architecture](#6-infrastructure-architecture)
7. [Database & Storage Architecture](#7-database--storage-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Observability Architecture](#9-observability-architecture)
10. [API Architecture](#10-api-architecture)
11. [Deployment Architecture](#11-deployment-architecture)
12. [End-to-End Request Lifecycle](#12-end-to-end-request-lifecycle)

---

## 1. Architecture Overview

### 1.1 High-Level System Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     AURA — SYSTEM OVERVIEW                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                        PRESENTATION LAYER                           │   ║
║   │            Streamlit Dashboard  │  REST API  │  CLI                 │   ║
║   └──────────────────────────────┬──────────────────────────────────────┘   ║
║                                  │                                          ║
║   ┌──────────────────────────────▼──────────────────────────────────────┐   ║
║   │                      ORCHESTRATION LAYER                            │   ║
║   │           Master Agent Coordinator (LangGraph State Machine)        │   ║
║   └──────────────────────────────┬──────────────────────────────────────┘   ║
║                                  │                                          ║
║   ┌──────────────────────────────▼──────────────────────────────────────┐   ║
║   │                         AGENT LAYER                                 │   ║
║   │   ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │   ║
║   │   │  Recon   │  │  Attack  │  │  Evaluator   │  │    Report    │  │   ║
║   │   │  Agent   │  │  Agent   │  │    Agent     │  │    Agent     │  │   ║
║   │   └──────────┘  └──────────┘  └──────────────┘  └──────────────┘  │   ║
║   └──────────────────────────────┬──────────────────────────────────────┘   ║
║                                  │                                          ║
║   ┌──────────────────────────────▼──────────────────────────────────────┐   ║
║   │                          TOOL LAYER                                 │   ║
║   │  PyRIT │ RAG Engine │ Nemo Guardrails │ Portkey │ Scoring Engines   │   ║
║   └──────────────────────────────┬──────────────────────────────────────┘   ║
║                                  │                                          ║
║   ┌──────────────────────────────▼──────────────────────────────────────┐   ║
║   │                      INFRASTRUCTURE LAYER                           │   ║
║   │         Redis │ Vector DB │ Langsmith │ Logfire │ LLM Providers     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 1.2 Architecture Principles

| Principle | Implementation |
|---|---|
| **Separation of Concerns** | Each agent owns one responsibility |
| **Stateless Agents** | All state stored in Redis, not in-memory |
| **Observability First** | Every action traced before execution |
| **Fail-Safe Design** | Guardrails prevent real-world harm |
| **Pluggable Attacks** | New attack types added without changing core |
| **Multi-Model Agnostic** | Portkey abstracts all LLM providers |

---

## 2. System Layers

### 2.1 Layer Breakdown

```
LAYER 1: PRESENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌────────────────────────────────────────────────────┐
  │                 Streamlit UI                        │
  │  - Target registration form                         │
  │  - Live attack progress dashboard                   │
  │  - Real-time logs viewer                            │
  │  - Vulnerability heatmap                            │
  │  - PDF report download button                       │
  └────────────────────────────────────────────────────┘
  ┌────────────────────────────────────────────────────┐
  │                   REST API                          │
  │  - POST /scan/start      → Begin red team scan      │
  │  - GET  /scan/{id}/status → Check scan progress     │
  │  - GET  /scan/{id}/report → Download report         │
  │  - POST /scan/{id}/stop  → Abort running scan       │
  └────────────────────────────────────────────────────┘

LAYER 2: ORCHESTRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌────────────────────────────────────────────────────┐
  │            LangGraph State Machine                  │
  │                                                     │
  │  ● Manages agent execution order                    │
  │  ● Handles conditional branching                    │
  │  ● Maintains global scan state                      │
  │  ● Triggers retries on failure                      │
  │  ● Enforces time/cost budgets                       │
  └────────────────────────────────────────────────────┘

LAYER 3: AGENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4 Specialized AI Agents (detailed in Agentic Doc)

LAYER 4: TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  PyRIT   │ │ RAG Eng. │ │  Nemo    │ │ Portkey  │
  │ Attack   │ │Knowledge │ │Guardrails│ │ Gateway  │
  │ Engine   │ │  Base    │ │ Tester   │ │  (LLMs)  │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
  ┌──────────┐ ┌──────────┐
  │ DeepEval │ │  RAGAS   │
  │  Scorer  │ │  Scorer  │
  └──────────┘ └──────────┘

LAYER 5: INFRASTRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Redis   │ │ ChromaDB │ │Langsmith │ │ Logfire  │
  │ Cache &  │ │ Vector   │ │ Tracing  │ │ Metrics  │
  │  Queue   │ │   DB     │ │          │ │          │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## 3. Component Architecture

### 3.1 Master Orchestrator Component

```
┌──────────────────────────────────────────────────────────────┐
│                    MASTER ORCHESTRATOR                        │
│                                                              │
│   Input: ScanConfig(target_url, scope, sensitivity)          │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              LangGraph State Machine                 │   │
│   │                                                     │   │
│   │   ScanState {                                       │   │
│   │     scan_id: UUID                                   │   │
│   │     target: TargetConfig                            │   │
│   │     recon_results: ReconData                        │   │
│   │     attack_queue: List[AttackPlan]                  │   │
│   │     attack_results: List[AttackResult]              │   │
│   │     eval_scores: List[EvalScore]                    │   │
│   │     report: SecurityReport                          │   │
│   │     status: ScanStatus                              │   │
│   │   }                                                 │   │
│   │                                                     │   │
│   │   Nodes: recon → plan → attack → evaluate → report  │   │
│   │   Edges: conditional routing based on results       │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   Output: SecurityReport + scan_id for status tracking      │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 PyRIT Integration Component

```
┌──────────────────────────────────────────────────────────────┐
│                     PyRIT ATTACK ENGINE                       │
│                                                              │
│   ┌───────────────────┐    ┌──────────────────────────────┐ │
│   │  Attack Strategies │    │     PyRIT Orchestrators      │ │
│   │                   │    │                              │ │
│   │  • prompt_inject  │───▶│  RedTeamingOrchestrator      │ │
│   │  • crescendo      │    │  CrescendoOrchestrator       │ │
│   │  • jailbreak      │    │  PromptSendingOrchestrator   │ │
│   │  • data_extract   │    │  TreeOfAttacksOrchestrator   │ │
│   │  • agent_attack   │    │                              │ │
│   └───────────────────┘    └──────────────┬───────────────┘ │
│                                           │                  │
│   ┌───────────────────────────────────────▼──────────────┐  │
│   │              PyRIT Scoring Engine                     │  │
│   │  SelfAskTrueFalseScorer │ HumanInTheLoopScorer        │  │
│   │  AzureContentFilterScorer │ SubStringScorer           │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   Target Adapters:                                           │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  OpenAIChatTarget │ HTTPTarget │ CustomAPITarget      │  │
│   └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 RAG Knowledge Base Component

```
┌──────────────────────────────────────────────────────────────┐
│                   RAG KNOWLEDGE BASE                          │
│                                                              │
│   Knowledge Sources:                                         │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  • OWASP LLM Top 10 (2025)                           │  │
│   │  • Known jailbreak templates (500+)                  │  │
│   │  • CVE database for AI systems                       │  │
│   │  • Attack strategy playbooks                         │  │
│   │  • Guardrail bypass techniques                       │  │
│   └────────────────────┬─────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│   ┌──────────────────────────────────────────────────────┐  │
│   │         Embedding Pipeline                            │  │
│   │         text-embedding-3-small (OpenAI)              │  │
│   └────────────────────┬─────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│   ┌──────────────────────────────────────────────────────┐  │
│   │         ChromaDB Vector Store                        │  │
│   │         Collections:                                 │  │
│   │           - attack_strategies                        │  │
│   │           - jailbreak_templates                      │  │
│   │           - vulnerability_patterns                   │  │
│   └────────────────────┬─────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│   ┌──────────────────────────────────────────────────────┐  │
│   │         Retriever                                    │  │
│   │         Query: "recon_fingerprint → best attacks"    │  │
│   │         Returns: Top-5 relevant attack strategies    │  │
│   └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Portkey Gateway Component

```
┌──────────────────────────────────────────────────────────────┐
│                    PORTKEY LLM GATEWAY                        │
│                                                              │
│   Routing Rules:                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  IF task == "attack_generation":                     │  │
│   │      → GPT-4o (most creative, best jailbreaks)       │  │
│   │                                                      │  │
│   │  IF task == "recon_probing":                         │  │
│   │      → GPT-3.5-turbo (fast + cheap)                  │  │
│   │                                                      │  │
│   │  IF task == "report_writing":                        │  │
│   │      → Claude-3.5-Sonnet (best long-form writing)    │  │
│   │                                                      │  │
│   │  IF task == "evaluation_scoring":                    │  │
│   │      → Gemini-1.5-Pro (best at following rubrics)    │  │
│   │                                                      │  │
│   │  IF primary_model FAILS:                            │  │
│   │      → Fallback to secondary model                   │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   Features Used:                                             │
│   • Load balancing across providers                          │
│   • Automatic retry with exponential backoff                 │
│   • Cost tracking per scan session                           │
│   • Rate limit management                                    │
│   • Request/response logging to Logfire                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Architecture

### 4.1 Complete Data Flow

```
USER INPUT
    │
    │  ScanConfig {
    │    target_url: "https://target-chatbot.com/api"
    │    model_hint: "gpt-4"  (optional)
    │    scope: ["prompt_injection", "jailbreak", "data_extraction"]
    │    sensitivity: "HIGH"
    │    max_attacks: 200
    │    time_limit: "2h"
    │  }
    │
    ▼
ORCHESTRATOR ─────────────────────────────────────────────────────
    │                                                              │
    │  Creates: scan_id = UUID()                                   │
    │  Stores:  Redis.set(scan_id, ScanState)                      │
    │  Traces:  Langsmith.start_trace(scan_id)                     │
    │                                                              │
    ▼                                                              │
RECON AGENT                                                        │
    │                                                              │
    │  Sends 30 probe requests to target                           │
    │  Returns: ReconData {                                        │
    │    model_fingerprint: "GPT-4-turbo (likely)"                 │
    │    system_prompt_hints: ["You are a helpful assistant..."]   │
    │    blocked_topics: ["weapons", "drugs", "adult"]             │
    │    response_style: "formal"                                  │
    │    guardrail_type: "NemoGuardrails-v2"                       │
    │  }                                                           │
    │                                                              │
    ▼                                                              │
ATTACK PLANNER (inside Orchestrator)                               │
    │                                                              │
    │  Queries RAG with ReconData                                  │
    │  Returns: AttackPlan[] sorted by expected_success_rate       │
    │                                                              │
    │  Attack Queue:                                               │
    │    1. Crescendo jailbreak (score: 0.85)                      │
    │    2. Indirect prompt injection (score: 0.72)                │
    │    3. System prompt extraction (score: 0.68)                 │
    │    4. Language switch bypass (score: 0.61)                   │
    │    ...                                                       │
    │                                                              │
    ▼                                                              │
ATTACK AGENT                                                       │
    │                                                              │
    │  For each AttackPlan:                                        │
    │    ├── PyRIT generates N attack variants                     │
    │    ├── Portkey routes to best LLM for generation             │
    │    ├── Fires attack at target via HTTPTarget                  │
    │    ├── Collects response                                      │
    │    ├── Redis.append(scan_id, AttackResult)                   │
    │    └── Logfire.log(attack_attempt)                           │
    │                                                              │
    │  Returns: AttackResult[] {                                   │
    │    attack_type, payload, response,                           │
    │    timestamp, model_used, tokens_used                        │
    │  }                                                           │
    │                                                              │
    ▼                                                              │
EVALUATOR AGENT                                                    │
    │                                                              │
    │  For each AttackResult:                                      │
    │    ├── DeepEval scores: harmfulness, toxicity, PII_leak      │
    │    ├── RAGAS scores: faithfulness, context_leak              │
    │    ├── PyRIT scorer: success/failure classification          │
    │    └── CVSS calculator: severity_score (0-10)               │
    │                                                              │
    │  Returns: EvalScore[] {                                      │
    │    attack_id, success: bool, severity: "CRITICAL",           │
    │    cvss_score: 9.1, details: str                             │
    │  }                                                           │
    │                                                              │
    ▼                                                              │
REPORT AGENT                                                       │
    │                                                              │
    │  Aggregates all EvalScores                                   │
    │  Groups by: severity, attack_type, attack_surface            │
    │  Generates: fix_recommendations per vulnerability            │
    │  Outputs:                                                    │
    │    ├── SecurityReport (PDF)                                  │
    │    ├── report.json (for CI/CD)                               │
    │    └── executive_summary.md                                  │
    │                                                              │
    ▼                                                   ───────────┘
FINAL OUTPUT
    • PDF Security Report
    • JSON Vulnerability Data
    • Langsmith Trace URL (full audit)
    • Logfire Dashboard Link
```

### 4.2 Redis Data Flow

```
Redis Key Schema:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

scan:{scan_id}:state        → ScanState (JSON)         TTL: 24h
scan:{scan_id}:recon        → ReconData (JSON)          TTL: 24h
scan:{scan_id}:attacks      → List[AttackResult]        TTL: 24h
scan:{scan_id}:scores       → List[EvalScore]           TTL: 24h
scan:{scan_id}:status       → "running"|"done"|"failed" TTL: 24h
scan:{scan_id}:progress     → {current: 45, total: 200} TTL: 24h

cache:attack:{hash}         → AttackResult              TTL: 7d
  (Prevents re-running identical attacks)

queue:attacks:{scan_id}     → Redis List (FIFO queue)   TTL: 24h
  (Attack Agent pops from this queue)

pubsub:scan:{scan_id}       → Real-time progress events
  (Streamlit dashboard subscribes to this)
```

---

## 5. Technology Integration Map

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    TECHNOLOGY INTEGRATION MAP                          ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │  PyRIT  │─────────▶ Attack Agent (generates + fires attacks) │    ║
║   └─────────┘         └─────────────────────────────────────────┘    ║
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │  RAG /  │─────────▶ Attack Planner (retrieves strategies)   │    ║
║   │ChromaDB │         └─────────────────────────────────────────┘    ║
║   └─────────┘                                                         ║
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │  Nemo   │─────────▶ Guardrail Tester (bypass detection)     │    ║
║   │ Guards  │         └─────────────────────────────────────────┘    ║
║   └─────────┘                                                         ║
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │Portkey  │─────────▶ All Agents (LLM routing for all tasks)  │    ║
║   │Gateway  │         └─────────────────────────────────────────┘    ║
║   └─────────┘                                                         ║
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │  Redis  │─────────▶ All Agents (state, cache, queue, pubsub) │   ║
║   └─────────┘         └─────────────────────────────────────────┘    ║
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │Langsmith│─────────▶ All Agents (execution tracing)          │    ║
║   └─────────┘         └─────────────────────────────────────────┘    ║
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │ Logfire │─────────▶ System Metrics (latency, cost, errors)  │    ║
║   └─────────┘         └─────────────────────────────────────────┘    ║
║                                                                       ║
║   ┌─────────┐         ┌─────────────────────────────────────────┐    ║
║   │DeepEval │─────────▶ Evaluator Agent (response scoring)      │    ║
║   │  RAGAS  │         └─────────────────────────────────────────┘    ║
║   └─────────┘                                                         ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 6. Infrastructure Architecture

### 6.1 Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DOCKER COMPOSE SERVICES                        │
│                                                                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│   │  app         │  │  redis       │  │  chromadb                │ │
│   │              │  │              │  │                          │ │
│   │ FastAPI +    │  │ Redis 7.x    │  │  Vector store for        │ │
│   │ Streamlit    │  │              │  │  RAG knowledge base      │ │
│   │ PORT: 8501   │  │ PORT: 6379   │  │  PORT: 8000              │ │
│   └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘ │
│          │                 │                      │                 │
│          └─────────────────┴──────────────────────┘                 │
│                            │                                        │
│                    Internal Docker Network                          │
│                                                                     │
│   External Services (Cloud):                                        │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│   │  Portkey API │  │  Langsmith   │  │  Logfire Cloud           │ │
│   │  (LLM route) │  │  (Tracing)   │  │  (Metrics)               │ │
│   └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│   ┌──────────────┐  ┌──────────────┐                               │
│   │  OpenAI API  │  │ Anthropic    │  ...other LLM APIs            │
│   └──────────────┘  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Database & Storage Architecture

### 7.1 Redis Schema

```
REDIS DATABASE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database 0 — Scan Sessions
  scan:{id}:state       STRING   → Serialized ScanState JSON
  scan:{id}:status      STRING   → "pending"|"running"|"done"|"error"
  scan:{id}:progress    HASH     → {current, total, phase}
  scan:{id}:attacks     LIST     → [AttackResult JSON, ...]
  scan:{id}:scores      LIST     → [EvalScore JSON, ...]
  scan:{id}:cost        HASH     → {tokens_used, usd_cost}

Database 1 — Attack Cache
  cache:attack:{md5(payload+target)}   STRING  → AttackResult JSON
    (Deduplication — skip if already attempted this exact attack)

Database 2 — Agent Queues
  queue:attacks:{scan_id}    LIST   → AttackPlan queue (LPUSH/RPOP)
  queue:reports:{scan_id}    LIST   → Results ready for reporting

Database 3 — PubSub Channels
  pubsub:progress:{scan_id}  → Real-time progress updates for UI
  pubsub:alerts:{scan_id}    → Critical vulnerability alerts
```

### 7.2 ChromaDB Collections

```
CHROMADB VECTOR STORE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Collection: attack_strategies
  Documents: OWASP LLM Top 10 guidelines
  Metadata:  {category, severity, target_type}
  Embedding: text-embedding-3-small

Collection: jailbreak_templates
  Documents: Known jailbreak prompt templates (500+)
  Metadata:  {technique, success_rate, model_specificity}
  Embedding: text-embedding-3-small

Collection: vulnerability_patterns
  Documents: CVE descriptions, AI vulnerability reports
  Metadata:  {cve_id, cvss_score, affected_systems}
  Embedding: text-embedding-3-small
```

---

## 8. Security Architecture

### 8.1 Ethical Guardrails (Protecting Against Misuse)

```
┌──────────────────────────────────────────────────────────────┐
│              ETHICAL SAFETY ARCHITECTURE                      │
│                                                              │
│  The Red Teaming Agent itself has guardrails to prevent      │
│  misuse — it must only be used on systems you own/have       │
│  explicit permission to test.                                │
│                                                              │
│  Safeguard 1: Target Allowlist                               │
│  ─────────────────────────────                               │
│  config.yaml → allowed_domains: [...]                        │
│  Orchestrator rejects targets not on the allowlist           │
│                                                              │
│  Safeguard 2: Attack Severity Limits                         │
│  ────────────────────────────────────                        │
│  sensitivity: "LOW"    → Only probe + safe jailbreaks        │
│  sensitivity: "MEDIUM" → Add data extraction tests           │
│  sensitivity: "HIGH"   → Full attack suite                   │
│                                                              │
│  Safeguard 3: Human-in-the-Loop for Destructive Actions      │
│  ────────────────────────────────────────────────────────    │
│  Any attack that could cause data deletion or                │
│  system disruption requires explicit human approval          │
│                                                              │
│  Safeguard 4: Nemo Guardrails on the Agent Itself            │
│  ─────────────────────────────────────────────────           │
│  The orchestrator itself runs behind Nemo Guardrails         │
│  to prevent the agent from generating real harmful content   │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Nemo Guardrails Integration

```
TWO ROLES OF NEMO GUARDRAILS IN THIS PROJECT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Role 1: DEFENDER (on the target system)
  → We deploy Nemo Guardrails on a test chatbot
  → Our attack agent tries to bypass it
  → We measure bypass success rate

Role 2: PROTECTOR (on our red team agent)
  → Prevents our agent from producing truly harmful content
  → Even when testing "harmful content generation" attacks,
    our agent generates the attack payload structure,
    not the actual harmful content

  guardrails_config.yml:
    define flow:
      user attack_generation
        if payload.severity == "REAL_HARM":
          bot refuse_and_log
        else:
          bot generate_test_payload
```

---

## 9. Observability Architecture

### 9.1 Langsmith Tracing

```
LANGSMITH TRACE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Trace: scan_{scan_id}
│
├── Run: recon_agent
│   ├── probe_1: {input, output, latency, tokens}
│   ├── probe_2: {input, output, latency, tokens}
│   └── fingerprint_analysis: {input, output}
│
├── Run: attack_planner
│   ├── rag_retrieval: {query, results, scores}
│   └── plan_generation: {recon_data, attack_queue}
│
├── Run: attack_agent
│   ├── attack_1 (crescendo)
│   │   ├── turn_1: {payload, response, score}
│   │   ├── turn_2: {payload, response, score}
│   │   └── turn_N: {payload, response, score}
│   ├── attack_2 (prompt_injection)
│   └── ...
│
├── Run: evaluator_agent
│   ├── deepeval_scoring: {metric, score, reason}
│   └── ragas_scoring: {metric, score, reason}
│
└── Run: report_agent
    └── report_generation: {findings, recommendations}
```

### 9.2 Logfire Metrics

```
LOGFIRE METRICS TRACKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System Metrics:
  • scan_duration_seconds (histogram)
  • attacks_per_minute (gauge)
  • attack_success_rate (gauge)
  • llm_api_cost_usd (counter)
  • tokens_consumed (counter)

Performance Metrics:
  • agent_latency_ms per agent (histogram)
  • redis_operation_latency_ms (histogram)
  • rag_retrieval_latency_ms (histogram)

Business Metrics:
  • vulnerabilities_found_count (counter per severity)
  • scans_completed_today (counter)
  • average_cvss_score_per_scan (histogram)
```

---

## 10. API Architecture

### 10.1 REST API Endpoints

```
BASE URL: http://localhost:8000/api/v1

POST   /scans
  Body:    ScanConfig JSON
  Returns: {scan_id, status: "pending", estimated_duration}

GET    /scans/{scan_id}
  Returns: {scan_id, status, progress, started_at}

GET    /scans/{scan_id}/report
  Returns: SecurityReport JSON (or 202 if still running)

GET    /scans/{scan_id}/report/pdf
  Returns: Binary PDF file

DELETE /scans/{scan_id}
  Action:  Abort running scan
  Returns: {scan_id, status: "aborted"}

GET    /scans/{scan_id}/trace
  Returns: {langsmith_url, logfire_url}

GET    /health
  Returns: {status: "healthy", redis: "up", chromadb: "up"}
```

---

## 11. Deployment Architecture

### 11.1 Docker Compose

```yaml
# docker-compose.yml

version: "3.9"

services:
  app:
    build: .
    ports:
      - "8501:8501"   # Streamlit UI
      - "8000:8000"   # FastAPI
    environment:
      - REDIS_URL=redis://redis:6379
      - CHROMA_URL=http://chromadb:8000
      - PORTKEY_API_KEY=${PORTKEY_API_KEY}
      - LANGSMITH_API_KEY=${LANGSMITH_API_KEY}
      - LOGFIRE_TOKEN=${LOGFIRE_TOKEN}
    depends_on:
      - redis
      - chromadb

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  redis_data:
  chroma_data:
```

---

## 12. End-to-End Request Lifecycle

```
T+0s    User submits ScanConfig via Streamlit UI
        │
T+0.1s  FastAPI creates scan_id, stores ScanState in Redis
        │
T+0.2s  Langsmith trace started, Logfire scan_start metric emitted
        │
T+0.5s  Recon Agent activated — begins probing target
        │
T+30s   Recon complete — 30 probes fired, fingerprint done
        Redis updated with ReconData
        │
T+31s   RAG retrieval — top attack strategies fetched from ChromaDB
        │
T+32s   Attack queue built — 200 attacks planned, pushed to Redis LIST
        │
T+33s   Attack Agent activates — pops attacks from Redis queue
        Portkey routes each attack generation to best LLM
        PyRIT fires attacks at target, collects responses
        Results pushed to Redis, every request logged to Langsmith
        │
T+2m    All 200 attacks complete
        │
T+2.1m  Evaluator Agent activates
        DeepEval + RAGAS score every attack response
        CVSS severity scores assigned
        Results stored in Redis
        │
T+3m    Report Agent activates
        Aggregates all findings from Redis
        Claude-3.5-Sonnet writes professional report via Portkey
        PDF generated, stored
        │
T+3.5m  Scan complete
        Langsmith trace closed, Logfire metrics flushed
        User notified via Streamlit PubSub channel
        PDF available for download
```

---

*This document describes the complete system architecture of the AI Red Teaming Agent.*  
*See the companion Agentic Architecture Document for detailed agent design.*
