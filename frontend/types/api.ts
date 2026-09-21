export type AttackCategory =
  | "prompt_injection"
  | "jailbreak"
  | "data_extraction"
  | "guardrail_bypass"
  | "agent_specific";

export type ScanStatus =
  | "created"
  | "recon"
  | "attacking"
  | "evaluating"
  | "reporting"
  | "completed"
  | "failed"
  | "aborted";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ScanConfigRequest {
  target_url: string;
  scope: AttackCategory[];
  max_attacks: number;
  timeout_seconds: number;
}

export interface ScanStatusResponse {
  scan_id: string;
  status: ScanStatus;
  attacks_completed: number;
  max_attacks: number;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface ScanSummary {
  scan_id: string;
  status: ScanStatus;
  target_url: string;
  created_at: string;
  attacks_completed: number;
  overall_risk_score: number | null;
}

export interface HealthResponse {
  status: string;
  redis_connected: boolean;
  pinecone_connected: boolean;
  version: string;
}

export interface VulnerabilityFinding {
  title: string;
  category: AttackCategory;
  severity: Severity;
  cvss_score: number;
  description: string;
  attack_payload: string;
  target_response: string;
  recommendation: string;
}

export interface SecurityReport {
  scan_id: string;
  target_url: string;
  scan_date: string;
  overall_risk_score: number;
  total_attacks: number;
  successful_attacks: number;
  success_rate: number;
  vulnerabilities: VulnerabilityFinding[];
  executive_summary: string;
  trace_url?: string;
  recommendations: string[];
}
