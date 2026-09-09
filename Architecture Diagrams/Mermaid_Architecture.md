# 🔮 AURA — Mermaid Architecture Diagrams
### Automated Universal Red-teaming Agent

> **Project:** AURA — Automated Universal Red-teaming Agent  
> **Focus:** Backend Architecture (Frontend TBD)  
> **Date:** September 2026

---

## 1. System Architecture (Full Stack Layers)

> Shows the **entire system** broken into 5 layers — from the API entry point down to infrastructure.

```mermaid
graph TD
    subgraph API["🌐 API LAYER"]
        A1["FastAPI REST API"]
        A2["CLI Interface"]
        A3["Webhooks"]
    end

    subgraph ORCH["🧠 ORCHESTRATION LAYER"]
        O1["Master Orchestrator<br/>LangGraph State Machine"]
    end

    subgraph AGENTS["🤖 AGENT LAYER"]
        AG1["🔍 Recon<br/>Agent"]
        AG2["⚔️ Attack<br/>Agent"]
        AG3["📊 Evaluator<br/>Agent"]
        AG4["📝 Report<br/>Agent"]
    end

    subgraph TOOLS["🔧 TOOL LAYER"]
        T1["PyRIT"]
        T2["RAG Engine<br/>ChromaDB"]
        T3["Nemo<br/>Guardrails"]
        T4["Portkey<br/>Gateway"]
        T5["DeepEval"]
        T6["RAGAS"]
    end

    subgraph INFRA["⚙️ INFRASTRUCTURE LAYER"]
        I1[("Redis")]
        I2[("ChromaDB")]
        I3["Langsmith"]
        I4["Logfire"]
        I5["LLM Providers<br/>OpenAI · Anthropic · Google"]
    end

    A1 & A2 & A3 --> O1
    O1 --> AG1 & AG2 & AG3 & AG4
    AG1 --> T2 & T4
    AG2 --> T1 & T2 & T3 & T4
    AG3 --> T5 & T6
    AG4 --> T4
    T1 & T2 & T3 & T4 & T5 & T6 --> I1 & I2 & I3 & I4 & I5

    style API fill:#7c3aed,stroke:#7c3aed,color:#fff
    style ORCH fill:#2563eb,stroke:#2563eb,color:#fff
    style AGENTS fill:#0891b2,stroke:#0891b2,color:#fff
    style TOOLS fill:#d97706,stroke:#d97706,color:#fff
    style INFRA fill:#059669,stroke:#059669,color:#fff
```

---

## 2. Agentic Workflow Architecture

> Shows **how the 4 agents work together** as a sequential pipeline, orchestrated by LangGraph, with shared services underneath.

```mermaid
graph LR
    subgraph ORCHESTRATOR["🧠 LangGraph Orchestrator"]
        direction LR
        START(("🚀 Start<br/>Scan")) --> RECON
        
        subgraph RECON["🔍 RECON AGENT"]
            R1["Probe target system"]
            R2["Fingerprint AI model"]
            R3["Map attack surface"]
            R4["Discover guardrails"]
        end

        RECON -- "ReconData" --> ATTACK

        subgraph ATTACK["⚔️ ATTACK AGENT"]
            A1["PyRIT orchestrators"]
            A2["Prompt injection"]
            A3["Crescendo jailbreak"]
            A4["Data extraction"]
        end

        ATTACK -- "AttackResult[]" --> EVAL

        subgraph EVAL["📊 EVALUATOR AGENT"]
            E1["DeepEval scoring"]
            E2["RAGAS metrics"]
            E3["CVSS severity"]
            E4["Success classification"]
        end

        EVAL -- "EvalScore[]" --> REPORT

        subgraph REPORT["📝 REPORT AGENT"]
            RP1["PDF generation"]
            RP2["Fix recommendations"]
            RP3["JSON for CI/CD"]
            RP4["Executive summary"]
        end

        REPORT --> DONE(("✅ Done"))
    end

    style RECON fill:#7c3aed,stroke:#a78bfa,color:#fff
    style ATTACK fill:#dc2626,stroke:#f87171,color:#fff
    style EVAL fill:#d97706,stroke:#fbbf24,color:#fff
    style REPORT fill:#059669,stroke:#34d399,color:#fff
    style START fill:#1e1e2e,stroke:#fff,color:#fff
    style DONE fill:#1e1e2e,stroke:#fff,color:#fff
```

---

## 3. Data Flow Architecture

> Traces **one complete scan request** from user input through every agent to the final security report.

```mermaid
flowchart TD
    USER["👤 User submits ScanConfig<br/>target_url · scope · sensitivity · max_attacks"]
    
    USER -- "POST /api/v1/scans" --> ORCH

    ORCH["🧠 Orchestrator<br/>Creates scan_id<br/>Stores ScanState in Redis<br/>Starts Langsmith trace"]

    ORCH -- "Dispatch" --> RECON

    RECON["🔍 Recon Agent<br/>30 probe requests<br/>Fingerprint model type<br/>Discover topic restrictions<br/>Map guardrail configuration"]

    RECON -- "ReconData" --> PLANNER

    PLANNER["📋 Attack Planner<br/>Query RAG for matching strategies<br/>Portkey selects best LLM<br/>Build prioritized attack queue"]

    PLANNER -- "AttackPlan[]" --> PYRIT

    PYRIT["⚔️ Attack Agent + PyRIT<br/>Generate attack variants<br/>Fire attacks at target<br/>Collect all responses<br/>Cache results in Redis<br/>Trace every request in Logfire"]

    PYRIT -- "AttackResult[]" --> EVALUATOR

    EVALUATOR["📊 Evaluator Agent<br/>DeepEval: harmfulness score<br/>RAGAS: information leakage score<br/>CVSS: severity classification<br/>Success / Failure determination"]

    EVALUATOR -- "EvalScore[]" --> REPORTER

    REPORTER["📝 Report Agent<br/>Aggregate all findings<br/>Generate PDF + JSON<br/>Write fix recommendations<br/>Assign overall risk score"]

    REPORTER -- "SecurityReport" --> OUTPUT

    OUTPUT["📦 Final Output<br/>PDF Security Report<br/>JSON Vulnerability Data<br/>Langsmith Trace URL<br/>Logfire Dashboard Link"]

    REDIS[("🔴 Redis<br/>State · Cache · Queues")]
    LANGSMITH["👁️ Langsmith<br/>Execution Tracing"]
    LOGFIRE["📊 Logfire<br/>Metrics & Monitoring"]

    ORCH -.-> REDIS
    RECON -.-> REDIS
    RECON -.-> LANGSMITH
    PYRIT -.-> REDIS
    PYRIT -.-> LOGFIRE
    EVALUATOR -.-> LANGSMITH
    REPORTER -.-> REDIS

    style USER fill:#334155,stroke:#94a3b8,color:#fff
    style ORCH fill:#2563eb,stroke:#60a5fa,color:#fff
    style RECON fill:#7c3aed,stroke:#a78bfa,color:#fff
    style PLANNER fill:#1e40af,stroke:#3b82f6,color:#fff
    style PYRIT fill:#dc2626,stroke:#f87171,color:#fff
    style EVALUATOR fill:#d97706,stroke:#fbbf24,color:#fff
    style REPORTER fill:#059669,stroke:#34d399,color:#fff
    style OUTPUT fill:#334155,stroke:#94a3b8,color:#fff
    style REDIS fill:#b91c1c,stroke:#fca5a5,color:#fff
    style LANGSMITH fill:#15803d,stroke:#86efac,color:#fff
    style LOGFIRE fill:#0e7490,stroke:#67e8f9,color:#fff
```

---

## 4. Infrastructure & Deployment Architecture

> Shows **how the system is deployed** — local Docker services vs external cloud services vs LLM providers.

```mermaid
graph TB
    subgraph DOCKER["🐳 Docker Compose — Local Deployment"]
        FASTAPI["🚀 FastAPI App<br/>PORT: 8000<br/>API + Agent Orchestration"]
        REDIS[("🔴 Redis 7.x<br/>PORT: 6379<br/>State · Cache · Queues")]
        CHROMA[("🟠 ChromaDB<br/>PORT: 8001<br/>Vector Store for RAG")]
        
        FASTAPI <--> REDIS
        FASTAPI <--> CHROMA
    end

    subgraph CLOUD["☁️ External Cloud Services"]
        PORTKEY["🌐 Portkey API<br/>LLM Routing & Load Balancing"]
        LANGSMITH["👁️ Langsmith<br/>Trace Logging & Audit"]
        LOGFIRE["📊 Logfire<br/>Metrics & Monitoring"]
    end

    subgraph LLM["🤖 LLM Providers — via Portkey"]
        OPENAI["OpenAI<br/>GPT-4o · GPT-3.5"]
        ANTHROPIC["Anthropic<br/>Claude 3.5 Sonnet"]
        GOOGLE["Google<br/>Gemini 1.5 Pro"]
    end

    FASTAPI -- "Traces" --> LANGSMITH
    FASTAPI -- "Metrics" --> LOGFIRE
    FASTAPI -- "LLM Requests" --> PORTKEY
    PORTKEY --> OPENAI & ANTHROPIC & GOOGLE

    style DOCKER fill:#1e293b,stroke:#475569,color:#fff
    style CLOUD fill:#1e1b4b,stroke:#6366f1,color:#fff
    style LLM fill:#1c1917,stroke:#78716c,color:#fff
    style FASTAPI fill:#2563eb,stroke:#60a5fa,color:#fff
    style REDIS fill:#dc2626,stroke:#f87171,color:#fff
    style CHROMA fill:#d97706,stroke:#fbbf24,color:#fff
    style PORTKEY fill:#7c3aed,stroke:#a78bfa,color:#fff
    style LANGSMITH fill:#059669,stroke:#34d399,color:#fff
    style LOGFIRE fill:#0891b2,stroke:#22d3ee,color:#fff
    style OPENAI fill:#334155,stroke:#94a3b8,color:#fff
    style ANTHROPIC fill:#334155,stroke:#94a3b8,color:#fff
    style GOOGLE fill:#334155,stroke:#94a3b8,color:#fff
```

---

## 5. Redis Data Schema

> Shows **all Redis keys** the system uses — how scan state, attack results, caches, and queues are organized.

```mermaid
erDiagram
    SCAN_SESSION {
        string scan_id PK
        json state "ScanState object"
        string status "pending | running | done | error"
        json progress "current count and total"
        json cost "tokens_used and usd_cost"
    }

    ATTACK_RESULTS {
        string scan_id FK
        string attack_type "injection | jailbreak | extraction"
        json payload "Attack prompt sent"
        json response "Target response received"
        string timestamp "ISO timestamp"
        string model_used "gpt-4o | claude-3.5"
        int tokens_used "Total tokens consumed"
    }

    EVAL_SCORES {
        string scan_id FK
        string attack_id FK
        boolean success "Did attack succeed"
        string severity "CRITICAL | HIGH | MEDIUM | LOW"
        float cvss_score "0.0 to 10.0"
        string details "Evaluation reasoning"
    }

    ATTACK_CACHE {
        string cache_key PK "md5 of payload + target"
        json result "Cached AttackResult"
        string ttl "7 days"
    }

    AGENT_QUEUE {
        string scan_id FK
        json attack_plan "AttackPlan popped by agent"
    }

    SCAN_SESSION ||--o{ ATTACK_RESULTS : "produces"
    ATTACK_RESULTS ||--o{ EVAL_SCORES : "scored by"
    SCAN_SESSION ||--o{ AGENT_QUEUE : "feeds"
    ATTACK_RESULTS ||--o{ ATTACK_CACHE : "deduplicated via"
```

---

## 6. Attack Categories Tree

> Shows **all 5 attack categories** and their sub-techniques that the Attack Agent tests.

```mermaid
mindmap
  root(("⚔️ Attack<br/>Categories"))
    🔴 Prompt Injection
      Direct Injection
        Ignore previous instructions
        Override system prompt
      Indirect Injection
        Poisoned RAG documents
        Hidden instructions in data
      Multi-turn Injection
        Split payload across messages
        Context window manipulation
    🟠 Jailbreaking
      Roleplay Attacks
        DAN — Do Anything Now
        Character persona bypass
      Crescendo Technique
        Gradual topic escalation
        Progressive boundary pushing
      Encoding Obfuscation
        Base64 encoded prompts
        Leetspeak substitution
      Many-shot Jailbreaking
        In-context learning exploit
    🟡 Data Extraction
      System Prompt Theft
        Repeat your instructions
        Markdown rendering trick
      Training Data Extraction
        Verbatim memorization probes
      RAG Knowledge Leak
        Dump all documents
        Retrieve confidential data
      PII Exfiltration
        Extract user data from context
    🟢 Guardrail Bypass
      Semantic Rephrasing
        Same intent different words
      Language Switching
        Non-English harmful requests
      Code Obfuscation
        Instructions hidden in code
      Roleplay Wrapper
        Fiction and hypothetical framing
    🔵 Agent-Specific
      Tool Call Manipulation
        Misuse connected tools
        Unauthorized file operations
      Memory Poisoning
        Inject false memories
        Corrupt long-term storage
      Agentic Loop Exploit
        Trigger infinite loops
        Resource exhaustion
      Privilege Escalation
        Elevate agent permissions
```

---

## Quick Reference — How Diagrams Connect

```mermaid
graph LR
    D1["1. System<br/>Architecture"] -- "What are the layers?" --> D2["2. Agentic<br/>Workflow"]
    D2 -- "How do agents work?" --> D3["3. Data Flow"]
    D3 -- "What happens per scan?" --> D4["4. Infrastructure"]
    D4 -- "How is it deployed?" --> D5["5. Redis Schema"]
    D5 -- "How is data stored?" --> D6["6. Attack Tree"]
    D6 -- "What attacks are tested?" --> D1

    style D1 fill:#7c3aed,stroke:#a78bfa,color:#fff
    style D2 fill:#0891b2,stroke:#22d3ee,color:#fff
    style D3 fill:#2563eb,stroke:#60a5fa,color:#fff
    style D4 fill:#059669,stroke:#34d399,color:#fff
    style D5 fill:#dc2626,stroke:#f87171,color:#fff
    style D6 fill:#d97706,stroke:#fbbf24,color:#fff
```

> [!NOTE]
> **Frontend is intentionally excluded.** The backend is designed **API-first** with FastAPI. Any frontend (Next.js, React, Vue, etc.) can plug in later by consuming the REST API endpoints.

---

*All diagrams represent the backend architecture of the AI Red Teaming Agent project.*
